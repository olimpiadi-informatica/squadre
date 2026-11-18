import { createWriteStream, existsSync } from "node:fs";
import { mkdtempDisposable, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import { and, eq, inArray, sql } from "drizzle-orm";
import { chunk, groupBy, keyBy, mapValues, minBy } from "es-toolkit";
import { maxBy } from "es-toolkit/compat";
import { extract } from "tar";

import { db } from "~/lib/db";
import {
  internetCheck,
  penalization,
  round,
  screenshot,
  submission,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
} from "~/lib/db/schema";
import { getRoundAdmin } from "~/lib/round";
import { shouldPublishRound } from "~/lib/round-config";
import { listRoundTasks } from "~/lib/task";
import { listRoundTeamsCredentials } from "~/lib/team";
import { refreshViews } from "~/lib/view";

import { parseCmsLog } from "./cms-log";
import { processInternetChecks } from "./internet";
import { processRanking } from "./ranking";
import { processScreenshots } from "./screenshot";
import { processSubmissions } from "./submission";

export enum UploadResultStep {
  UPLOAD_ARCHIVE,
  EXTRACT_ARCHIVE,
  PARSE_RANKIND,
  PARSE_SUBMISSIONS,
  PARSE_LOGS,
  PARSE_INTERNET,
  SAVE_RANKIND,
  SAVE_SUBMISSIONS,
  SAVE_PARTICIPATION,
  SAVE_INTERNET,
  PUBLISH_ROUND,
}

export type ParseResultOptions = {
  onStep?: (step: UploadResultStep) => void | Promise<void>;
  onWarning?: (message: string) => void;
};

// Il protocollo di Postgres accetta al massimo 65535 parametri per statement:
// con 3-9 colonne per riga i limiti qui sotto restano larghi, e riducono di
// 4-10 volte i round-trip verso il database rispetto ai vecchi chunk da 500.
const SCORE_CHUNK_SIZE = 5000;
const SUBMISSION_CHUNK_SIZE = 500;
const INTERNET_CHECK_CHUNK_SIZE = 2000;
const SCREENSHOT_CHUNK_SIZE = 2000;
const TEAM_ROUND_UPDATE_CHUNK_SIZE = 5000;

export async function parseResult(
  archive: File,
  editionId: string,
  roundSlug: string,
  { onStep, onWarning }: ParseResultOptions = {},
): Promise<void> {
  const report = async (step: UploadResultStep) => {
    await onStep?.(step);
  };

  const roundData = await getRoundAdmin(editionId, roundSlug);
  if (!roundData) {
    throw new Error("Round non trovato");
  }

  await report(UploadResultStep.UPLOAD_ARCHIVE);
  await using tempDir = await mkdtempDisposable(path.join(tmpdir(), "round-result-"));
  const archivePath = path.join(tempDir.path, "archive.tar.gz");

  await pipeline(archive.stream() as ReadableStream, createWriteStream(archivePath));

  await report(UploadResultStep.EXTRACT_ARCHIVE);
  await extract({ file: archivePath, cwd: tempDir.path });

  const archiveFiles = await readdir(tempDir.path, { withFileTypes: true });
  const roundDirent = archiveFiles.find((entry) => entry.isDirectory());
  if (!roundDirent) {
    throw new Error("L'archivio deve contenere una cartella");
  }

  const roundPath = path.join(tempDir.path, roundDirent.name);
  const rankingPath = getPath(roundPath, ["ranking.csv"]);
  const rankingJuniorPath = getPath(roundPath, ["ranking-debutant.csv", "ranking-esordienti.csv"]);
  const submissionsPath = getPath(roundPath, ["subs"]);
  const cmsLogPath = getPath(roundPath, ["cms.log"]);
  const proctoringPath = getPath(roundPath, ["logs", "internet", "internet-check"]);

  await report(UploadResultStep.PARSE_RANKIND);
  const teams = keyBy(await listRoundTeamsCredentials(editionId, roundSlug), (t) => t.slug);
  const teamRoundIds = mapValues(teams, (t) => t.teamRoundId);
  if (Object.keys(teams).length === 0) {
    throw new Error("Nessuna squadra trovata per questo round");
  }

  // Un round ospita sia i regolari sia gli esordienti: ogni classifica
  // contiene solo le squadre del proprio campionato.
  const teamIdsOf = (junior: boolean) =>
    Object.fromEntries(
      Object.values(teams)
        .filter((t) => t.junior === junior)
        .map((t) => [t.slug, t.teamId]),
    );
  const teamIdsByChampionship = {
    regular: teamIdsOf(false),
    junior: teamIdsOf(true),
  };

  const scores = await processRanking(
    rankingPath,
    editionId,
    roundSlug,
    teamIdsByChampionship.regular,
    false,
  );
  const juniorScores = await processRanking(
    rankingJuniorPath,
    editionId,
    roundSlug,
    teamIdsByChampionship.junior,
    true,
  );

  await report(UploadResultStep.PARSE_SUBMISSIONS);
  const { submissions, skipped } = await processSubmissions(
    submissionsPath,
    editionId,
    roundSlug,
    teams,
  );
  for (const { fileName, reason } of skipped) {
    onWarning?.(`Submission ignorata ${fileName}: ${reason}`);
  }
  const firstSubmissionByTeamRoundId = mapValues(
    groupBy(submissions, (s) => s.teamRoundId),
    (subs) =>
      minBy(
        subs.map((s) => s.timestamp),
        (t) => t.getTime(),
      ),
  );
  const lastSubmissionByTeamRoundId = mapValues(
    groupBy(submissions, (s) => s.teamRoundId),
    (subs) =>
      maxBy(
        subs.map((s) => s.timestamp),
        (t) => t.getTime(),
      ),
  );

  await report(UploadResultStep.PARSE_LOGS);
  const loggedUsers = await parseCmsLog(cmsLogPath);

  await report(UploadResultStep.PARSE_INTERNET);
  const [internetChecks, screenshots] = await Promise.all([
    processInternetChecks(
      proctoringPath,
      roundData,
      teams,
      firstSubmissionByTeamRoundId,
      lastSubmissionByTeamRoundId,
    ),
    processScreenshots(proctoringPath, teams),
  ]);

  // I punteggi vanno cancellati per i task del round, non per squadra: le
  // stesse squadre gareggiano in più round e i loro punteggi degli altri round
  // devono restare.
  const [roundTasks, roundJuniorTasks] = await Promise.all([
    listRoundTasks(editionId, roundSlug, false),
    listRoundTasks(editionId, roundSlug, true),
  ]);
  const roundTaskIds = [...new Set([...roundTasks, ...roundJuniorTasks].map((t) => t.id))];

  // Tutte le scritture stanno in un'unica transazione: un solo commit invece
  // di uno per chunk, e nessuno stato a metà se qualcosa fallisce. Le letture
  // pubbliche continuano a vedere i risultati precedenti fino al commit.
  await db.transaction(async (tx) => {
    await report(UploadResultStep.SAVE_RANKIND);
    await tx.delete(teamTaskScore).where(inArray(teamTaskScore.taskId, roundTaskIds));
    for (const scoreChunk of chunk([...scores, ...juniorScores], SCORE_CHUNK_SIZE)) {
      await tx
        .insert(teamTaskScore)
        .values(scoreChunk)
        .onConflictDoUpdate({
          target: [teamTaskScore.taskId, teamTaskScore.teamId],
          set: { score: sql.raw(`EXCLUDED.${teamTaskScore.score.name}`) },
        });
    }

    await report(UploadResultStep.SAVE_SUBMISSIONS);
    await tx.delete(submission).where(inArray(submission.teamRoundId, Object.values(teamRoundIds)));
    for (const submissionChunk of chunk(submissions, SUBMISSION_CHUNK_SIZE)) {
      await tx.insert(submission).values(submissionChunk);
    }

    // Le penalizzazioni puntano alle submission (copiature) tramite un id che
    // il reimport rigenera, e portano stati che non hanno più senso sui nuovi
    // risultati (ricorsi, invii). Se restassero, la pagina delle copiature
    // mostrerebbe riferimenti vuoti: le azzeriamo insieme ai risultati, così
    // vanno reimportati i TSV delle copiature e i CSV di proctoring.
    await tx.delete(penalization).where(
      inArray(
        penalization.id,
        tx
          .select({ id: teamRoundPenalization.penalizationId })
          .from(teamRoundPenalization)
          .where(inArray(teamRoundPenalization.teamRoundId, Object.values(teamRoundIds))),
      ),
    );

    await report(UploadResultStep.SAVE_PARTICIPATION);
    const scoredTeamIds = new Set<number>();
    for (const s of [...scores, ...juniorScores]) {
      if (s.score > 0) {
        scoredTeamIds.add(s.teamId);
      }
    }
    for (const sub of submissions) {
      if (sub.score > 0) {
        const t = Object.values(teams).find((tm) => tm.teamRoundId === sub.teamRoundId);
        if (t) scoredTeamIds.add(t.teamId);
      }
    }

    const submittedTeamRoundIds = new Set<number>();
    for (const sub of submissions) {
      submittedTeamRoundIds.add(sub.teamRoundId);
    }

    const scoredRoundIds: number[] = [];
    const submittedRoundIds: number[] = [];
    const loggedRoundIds: number[] = [];
    const nullRoundIds: number[] = [];

    for (const t of Object.values(teams)) {
      if (scoredTeamIds.has(t.teamId)) {
        scoredRoundIds.push(t.teamRoundId);
      } else if (submittedTeamRoundIds.has(t.teamRoundId)) {
        submittedRoundIds.push(t.teamRoundId);
      } else if (loggedUsers.has(t.slug)) {
        loggedRoundIds.push(t.teamRoundId);
      } else {
        nullRoundIds.push(t.teamRoundId);
      }
    }

    if (scoredRoundIds.length > 0) {
      for (const chunkIds of chunk(scoredRoundIds, TEAM_ROUND_UPDATE_CHUNK_SIZE)) {
        await tx
          .update(teamRound)
          .set({ participationStatus: "scored" })
          .where(inArray(teamRound.id, chunkIds));
      }
    }
    if (submittedRoundIds.length > 0) {
      for (const chunkIds of chunk(submittedRoundIds, TEAM_ROUND_UPDATE_CHUNK_SIZE)) {
        await tx
          .update(teamRound)
          .set({ participationStatus: "submitted" })
          .where(inArray(teamRound.id, chunkIds));
      }
    }
    if (loggedRoundIds.length > 0) {
      for (const chunkIds of chunk(loggedRoundIds, TEAM_ROUND_UPDATE_CHUNK_SIZE)) {
        await tx
          .update(teamRound)
          .set({ participationStatus: "logged" })
          .where(inArray(teamRound.id, chunkIds));
      }
    }
    if (nullRoundIds.length > 0) {
      for (const chunkIds of chunk(nullRoundIds, TEAM_ROUND_UPDATE_CHUNK_SIZE)) {
        await tx
          .update(teamRound)
          .set({ participationStatus: null })
          .where(inArray(teamRound.id, chunkIds));
      }
    }

    await report(UploadResultStep.SAVE_INTERNET);
    await tx
      .delete(internetCheck)
      .where(inArray(internetCheck.teamRoundId, Object.values(teamRoundIds)));
    for (const internetCheckChunk of chunk(internetChecks, INTERNET_CHECK_CHUNK_SIZE)) {
      await tx.insert(internetCheck).values(internetCheckChunk);
    }

    await tx.delete(screenshot).where(inArray(screenshot.teamRoundId, Object.values(teamRoundIds)));
    for (const screenshotChunk of chunk(screenshots, SCREENSHOT_CHUNK_SIZE)) {
      await tx.insert(screenshot).values(screenshotChunk);
    }
  });

  await report(UploadResultStep.PUBLISH_ROUND);
  await db
    .update(round)
    .set({ public: shouldPublishRound(roundSlug) })
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));
  await refreshViews();
}

function getPath(basePath: string, fileNames: string[]) {
  for (const fileName of fileNames) {
    const file = path.join(basePath, fileName);
    if (existsSync(file)) return file;
  }

  throw new Error(`Nessun file trovato tra: ${fileNames.join(", ")}`);
}

import { createWriteStream, existsSync } from "node:fs";
import { mkdtempDisposable, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import { and, eq, inArray, sql } from "drizzle-orm";
import { chunk, groupBy, keyBy, mapValues } from "es-toolkit";
import { maxBy } from "es-toolkit/compat";
import { extract } from "tar";

import { db } from "~/lib/db";
import { internetCheck, round, submission, teamTaskScore } from "~/lib/db/schema";
import { getRoundAdmin } from "~/lib/round";
import { shouldPublishRound } from "~/lib/round-config";
import { listRoundTeamsCredentials } from "~/lib/team";
import { refreshViews } from "~/lib/view";

import { processInternetChecks } from "./internet";
import { processRanking } from "./ranking";
import { processSubmissions } from "./submission";

export enum UploadResultStep {
  UPLOAD_ARCHIVE,
  EXTRACT_ARCHIVE,
  PARSE_RANKIND,
  PARSE_SUBMISSIONS,
  PARSE_INTERNET,
  SAVE_RANKIND,
  SAVE_SUBMISSIONS,
  SAVE_INTERNET,
  PUBLISH_ROUND,
}

export async function* parseResult(
  archive: File,
  editionId: string,
  roundSlug: string,
): AsyncGenerator<UploadResultStep> {
  const roundData = await getRoundAdmin(editionId, roundSlug);
  if (!roundData) {
    throw new Error("Round non trovato");
  }

  yield UploadResultStep.UPLOAD_ARCHIVE;
  await using tempDir = await mkdtempDisposable(path.join(tmpdir(), "round-result-"));
  const archivePath = path.join(tempDir.path, "archive.tar.gz");

  await pipeline(archive.stream() as ReadableStream, createWriteStream(archivePath));

  yield UploadResultStep.EXTRACT_ARCHIVE;
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
  const internetPath = getPath(roundPath, ["internet", "internet-check"]);

  yield UploadResultStep.PARSE_RANKIND;
  const teams = keyBy(await listRoundTeamsCredentials(editionId, roundSlug), (t) => t.slug);
  const teamIds = mapValues(teams, (t) => t.teamId);
  const teamRoundIds = mapValues(teams, (t) => t.teamRoundId);
  if (Object.keys(teams).length === 0) {
    throw new Error("Nessuna squadra trovata per questo round");
  }

  const scores = await processRanking(rankingPath, editionId, roundSlug, teamIds, false);
  const juniorScores = await processRanking(rankingJuniorPath, editionId, roundSlug, teamIds, true);

  yield UploadResultStep.PARSE_SUBMISSIONS;
  const submissions = await processSubmissions(submissionsPath, editionId, roundSlug, teams);
  const lastSubmissionByTeamRoundId = mapValues(
    groupBy(submissions, (s) => s.teamRoundId),
    (subs) =>
      maxBy(
        subs.map((s) => s.timestamp),
        (t) => t.getTime(),
      ),
  );

  yield UploadResultStep.PARSE_INTERNET;
  const internetChecks = await processInternetChecks(
    internetPath,
    roundData,
    teams,
    lastSubmissionByTeamRoundId,
  );

  yield UploadResultStep.SAVE_RANKIND;
  await db.delete(teamTaskScore).where(inArray(teamTaskScore.teamId, Object.values(teamIds)));
  for (const scoreChunk of chunk([...scores, ...juniorScores], 500)) {
    await db
      .insert(teamTaskScore)
      .values(scoreChunk)
      .onConflictDoUpdate({
        target: [teamTaskScore.taskId, teamTaskScore.teamId],
        set: { score: sql.raw(`EXCLUDED.${teamTaskScore.score.name}`) },
      });
  }

  yield UploadResultStep.SAVE_SUBMISSIONS;
  await db.delete(submission).where(inArray(submission.teamRoundId, Object.values(teamRoundIds)));
  for (const submissionChunk of chunk(submissions, 200)) {
    await db.insert(submission).values(submissionChunk);
  }

  yield UploadResultStep.SAVE_INTERNET;
  await db
    .delete(internetCheck)
    .where(inArray(internetCheck.teamRoundId, Object.values(teamRoundIds)));
  for (const internetCheckChunk of chunk(internetChecks, 500)) {
    await db.insert(internetCheck).values(internetCheckChunk);
  }

  yield UploadResultStep.PUBLISH_ROUND;
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

import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdtempDisposable, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import { and, eq, sql } from "drizzle-orm";
import { keyBy } from "es-toolkit";
import Papa from "papaparse";
import { extract } from "tar";
import { z } from "zod";

import { db } from "~/lib/db";
import { round, team, teamTaskScore } from "~/lib/db/schema";
import { listRoundTasks } from "~/lib/task";

export enum UploadResultStep {
  UPLOAD_ARCHIVE,
  EXTRACT_ARCHIVE,
  VALIDATE_ARCHIVE,
  PARSE_RANKIND,
  SAVE_RESULTS,
  PUBLISH_ROUND,
  UPLOAD_COMPLETED,
}

export async function* parseRanking(
  archive: File,
  editionId: string,
  roundSlug: string,
): AsyncGenerator<UploadResultStep> {
  yield UploadResultStep.UPLOAD_ARCHIVE;
  await using tempDir = await mkdtempDisposable(path.join(tmpdir(), "round-result-"));
  const archivePath = path.join(tempDir.path, "archive.tar.gz");

  await pipeline(archive.stream() as ReadableStream, createWriteStream(archivePath));

  yield UploadResultStep.EXTRACT_ARCHIVE;
  await extract({ file: archivePath, cwd: tempDir.path });

  yield UploadResultStep.VALIDATE_ARCHIVE;
  const archiveFiles = await readdir(tempDir.path, { withFileTypes: true });
  const archiveDir = archiveFiles.find((entry) => entry.isDirectory());
  if (!archiveDir) {
    throw new Error("L'archivio deve contenere una cartella");
  }

  const rankingPath = path.join(tempDir.path, archiveDir.name, "ranking.csv");
  const rankingJuniorPath = path.join(tempDir.path, archiveDir.name, "ranking-debutant.csv");
  if (!existsSync(rankingPath)) {
    throw new Error("File ranking.csv non trovato nell'archivio");
  }
  if (!existsSync(rankingJuniorPath)) {
    throw new Error("File ranking-debutant.csv non trovato nell'archivio");
  }

  yield UploadResultStep.PARSE_RANKIND;
  const scores = await processRanking(
    path.join(tempDir.path, archiveDir.name, "ranking.csv"),
    editionId,
    roundSlug,
    false,
  );

  const juniorScores = await processRanking(
    path.join(tempDir.path, archiveDir.name, "ranking-debutant.csv"),
    editionId,
    roundSlug,
    true,
  );

  yield UploadResultStep.SAVE_RESULTS;
  await db
    .insert(teamTaskScore)
    .values([...scores, ...juniorScores])
    .onConflictDoUpdate({
      target: [teamTaskScore.taskId, teamTaskScore.teamId],
      set: { score: sql.raw(`EXCLUDED.${teamTaskScore.score.name}`) },
    });

  yield UploadResultStep.PUBLISH_ROUND;
  await db
    .update(round)
    .set({ public: true })
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));

  yield UploadResultStep.UPLOAD_COMPLETED;
}

async function processRanking(
  csvPath: string,
  editionId: string,
  roundSlug: string,
  junior: boolean,
) {
  const source = createReadStream(csvPath);

  const rows = await new Promise<unknown[]>((resolve, reject) => {
    Papa.parse(source, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
    });
  });

  const data = z.array(csvRowSchema).parse(rows);
  if (data.length === 0) {
    throw new Error("Nessun dato trovato nel file CSV");
  }

  const tasks = await listRoundTasks(editionId, roundSlug, junior);
  if (tasks.length === 0) {
    throw new Error("Nessun task trovato per questo round");
  }

  const teams = await db
    .select({ id: team.id, slug: team.slug })
    .from(team)
    .where(eq(team.editionId, editionId));
  if (teams.length === 0) {
    throw new Error("Nessuna squadra trovata per questa edizione");
  }

  const teamMap = keyBy(teams, (t) => t.slug);

  return data
    .filter((row) => teamMap[row.Username])
    .flatMap((row) =>
      tasks.map((task) => {
        const score = junior ? row[`${task.slug}_esordienti`] : row[task.slug];
        if (!score) {
          throw new Error(`Punteggio mancante per il task "${task.slug}"`);
        }

        return {
          taskId: task.id,
          teamId: teamMap[row.Username].id,
          score: Math.round(Number(junior ? row[`${task.slug}_esordienti`] : row[task.slug])),
        };
      }),
    );
}

const csvRowSchema = z
  .object({
    Username: z.string(),
    User: z.string(),
    Team: z.string(),
    Global: z.string(),
  })
  .catchall(z.string());

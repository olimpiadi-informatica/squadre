import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdtempDisposable, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import { and, eq, sql } from "drizzle-orm";
import Papa from "papaparse";
import { extract } from "tar";
import { z } from "zod";

import { db } from "~/lib/db";
import { task, team, teamTaskScore } from "~/lib/db/schema";

export async function parseRanking(archive: File, editionId: string, roundId: number) {
  await using tempDir = await mkdtempDisposable(path.join(tmpdir(), "round-result-"));
  const archivePath = path.join(tempDir.path, "archive.tar.gz");

  await pipeline(archive.stream() as ReadableStream, createWriteStream(archivePath));
  await extract({ file: archivePath, cwd: tempDir.path });

  const archiveFiles = await readdir(tempDir.path, { withFileTypes: true });
  const archiveDir = archiveFiles.find((entry) => entry.isDirectory());
  if (!archiveDir) {
    throw new Error("No directory found in archive");
  }

  await processRanking(path.join(tempDir.path, archiveDir.name, "ranking.csv"), editionId, roundId);
  await processRanking(
    path.join(tempDir.path, archiveDir.name, "ranking-debutant.csv"),
    editionId,
    roundId,
  );
}

async function processRanking(csvPath: string, editionId: string, roundId: number): Promise<void> {
  if (!existsSync(csvPath)) {
    throw new Error(`File ${csvPath} not found`);
  }
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
    throw new Error(`No data found in ${csvPath}`);
  }

  const tasks = await db
    .select({ id: task.id, slug: task.slug })
    .from(task)
    .where(eq(task.roundId, roundId));
  if (tasks.length === 0) {
    throw new Error(`No tasks found for round ${roundId}`);
  }

  const scores = data.flatMap((row) =>
    tasks
      .filter((task) => !!row[task.slug])
      .map((task) => ({
        taskId: task.id,
        teamId: sql<number>`${db
          .select({ id: team.id })
          .from(team)
          .where(and(eq(team.name, row.Username), eq(team.editionId, editionId)))}`,
        score: Math.round(Number(row[task.slug])),
      })),
  );
  if (scores.length === 0) {
    throw new Error(`No scores found for round ${roundId}`);
  }

  await db
    .insert(teamTaskScore)
    .values(scores)
    .onConflictDoUpdate({
      target: [teamTaskScore.taskId, teamTaskScore.teamId],
      set: { score: sql.raw(`EXCLUDED.${teamTaskScore.score.name}`) },
    });
}

const csvRowSchema = z
  .object({
    Username: z.string(),
    User: z.string(),
    Team: z.string(),
    Global: z.string(),
  })
  .catchall(z.string());

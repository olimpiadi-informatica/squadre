import { createReadStream } from "node:fs";

import Papa from "papaparse";
import { z } from "zod";

import { listRoundTasks } from "~/lib/task";

export async function processRanking(
  csvPath: string,
  editionId: string,
  roundSlug: string,
  teams: Record<string, number>,
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

  return data
    .filter((row) => teams[row.Username] != null)
    .flatMap((row) =>
      tasks.map((task) => {
        const score = junior ? row[`${task.slug}_esordienti`] : row[task.slug];
        if (!score) {
          throw new Error(`Punteggio mancante per il task "${task.slug}"`);
        }

        return {
          taskId: task.id,
          teamId: teams[row.Username],
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

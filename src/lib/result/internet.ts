import { hash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { isPlainObject, sortBy } from "es-toolkit";
import { z } from "zod";

import type { internetCheck } from "~/lib/db/schema";

export async function processInternetChecks(
  internetPath: string,
  roundId: number,
  teams: Record<string, number>,
) {
  const rows: (typeof internetCheck.$inferInsert)[] = [];
  const teamSlugs = await readdir(internetPath);

  for (const team of teamSlugs) {
    if (teams[team] == null) continue;

    const jsonlPath = path.join(internetPath, team, "internet.json");
    const content = await readFile(jsonlPath, "utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim();
      if (!line) continue;

      try {
        const parsedLine = internetCheckLineSchema.parse(JSON.parse(line));
        rows.push({
          teamId: teams[team],
          roundId,
          ts: new Date(parsedLine.ts),
          serverTs: new Date(parsedLine.server_ts),
          ic: parsedLine.ic,
          pcHash: getPcHash(parsedLine),
        });
      } catch (error) {
        throw new Error(`Errore nel file ${jsonlPath} alla riga ${index + 1}`, { cause: error });
      }
    }
  }

  return rows;
}

function getPcHash(entry: InternetCheckLine): string {
  const { ic: _ic, server_ts: _serverTs, ts: _ts, ...rest } = entry;
  const stableData = stableStringify(rest);
  return hash("sha256", stableData);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = sortBy(Object.entries(value), ["0"]);
    return `{${entries
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

const internetCheckLineSchema = z
  .object({
    ts: z.number().int(),
    ic: z.array(z.boolean()),
    server_ts: z.number().int(),
  })
  .catchall(z.unknown());

type InternetCheckLine = z.infer<typeof internetCheckLineSchema>;

import { readFile } from "node:fs/promises";
import path from "node:path";

import { flatMapAsync, limitAsync } from "es-toolkit";

import type { screenshot } from "~/lib/db/schema";
import type { TeamCredential } from "~/lib/team";

type ScreenshotInsert = typeof screenshot.$inferInsert;

/**
 * I log di proctoring contengono sia i controlli internet (`ic`) sia gli
 * screenshot (`filename`). Questo parser estrae i secondi; i primi restano a
 * `processInternetChecks`, che legge lo stesso file.
 */
export async function processScreenshots(
  logsPath: string,
  teams: Record<string, TeamCredential>,
): Promise<ScreenshotInsert[]> {
  const rows = await flatMapAsync(
    Object.entries(teams),
    limitAsync(async ([teamSlug, team]) => {
      const content = await readTeamLogFile(logsPath, teamSlug, '"filename"');
      if (!content) return [];

      return parseScreenshotLines(content, team.teamRoundId);
    }, 32),
  );

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.teamRoundId}|${row.pcHash}|${row.ts.getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readTeamLogFile(logsPath: string, teamSlug: string, marker: string) {
  const logs = await readFile(path.join(logsPath, teamSlug, "logs.json"), "utf8").catch(() => null);
  if (logs?.includes(marker)) return logs;

  const legacy = await readFile(path.join(logsPath, teamSlug, "internet.json"), "utf8").catch(
    () => null,
  );
  return legacy ?? logs;
}

function parseScreenshotLines(content: string, teamRoundId: number): ScreenshotInsert[] {
  const rows: ScreenshotInsert[] = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line) as {
        client_ts?: unknown;
        ts?: unknown;
        fp?: unknown;
        filename?: unknown;
      };

      const tsMs =
        typeof parsed.client_ts === "number"
          ? Math.round(parsed.client_ts * 1000)
          : typeof parsed.ts === "number"
            ? parsed.ts
            : null;
      if (tsMs === null || typeof parsed.filename !== "string" || typeof parsed.fp !== "string") {
        continue;
      }

      const ts = new Date(tsMs);
      if (Number.isNaN(ts.getTime())) continue;

      rows.push({
        teamRoundId,
        pcHash: parsed.fp,
        ts,
        filename: parsed.filename,
      });
    } catch {
      // Riga malformata: le altre righe del log restano valide.
    }
  }

  return rows;
}

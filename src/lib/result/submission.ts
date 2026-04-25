import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { isValid, parse } from "date-fns";
import { flatMapAsync, keyBy, limitAsync } from "es-toolkit";

import type { submission } from "~/lib/db/schema";
import { listRoundTasks } from "~/lib/task";
import type { TeamCredential } from "~/lib/team";

export async function processSubmissions(
  subsPath: string,
  editionId: string,
  roundSlug: string,
  teams: Record<string, TeamCredential>,
): Promise<(typeof submission.$inferInsert)[]> {
  const [regularTasks, juniorTasks, files] = await Promise.all([
    listRoundTasks(editionId, roundSlug, false),
    listRoundTasks(editionId, roundSlug, true),
    readdir(subsPath, { withFileTypes: true }),
  ]);

  const taskMaps = {
    regular: keyBy(regularTasks, (task) => task.slug),
    junior: keyBy(juniorTasks, (task) => task.slug),
  };

  return flatMapAsync(
    files.filter((entry) => entry.isFile()),
    limitAsync(async (entry) => {
      const filePath = path.join(subsPath, entry.name);
      const code = await readFile(filePath, "utf8");

      const match = /^(?<slug>\d+)\.\w+\.(?<language>\w+)$/u.exec(entry.name);
      if (!match?.groups) {
        throw new Error(`Nome submission non valido: ${entry.name}`);
      }

      const { slug, language } = match.groups;

      const teamSlug = getMetadataValue(code, "user", entry.name);
      const team = teams[teamSlug];
      if (!team) return [];

      const taskName = getMetadataValue(code, "task", entry.name);
      const task = team.junior
        ? taskMaps.junior[taskName.replace("_esordienti", "")]
        : taskMaps.regular[taskName];
      if (!task) {
        throw new Error(`Task non trovato per la submission: ${entry.name}`);
      }

      return [
        {
          slug,
          teamRoundId: team.teamRoundId,
          taskId: task.id,
          score: parseScore(getMetadataValue(code, "score", entry.name), entry.name),
          timestamp: parseTimestamp(getMetadataValue(code, "date", entry.name), entry.name),
          language,
          code,
        } satisfies typeof submission.$inferInsert,
      ];
    }, 64),
  );
}

function getMetadataValue(source: string, key: string, fileName: string): string {
  const match = new RegExp(String.raw`(?:^|\n)\s*\*?\s*${key}:\s*(.+?)\s*$`, "mu").exec(source);
  if (!match?.[1]) {
    throw new Error(`Metadato "${key}" mancante nella submission: ${fileName}`);
  }

  return match[1].trim();
}

function parseScore(rawScore: string, fileName: string): number {
  const score = Number(rawScore);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`Punteggio non valido nella submission: ${fileName}`);
  }

  return Math.round(score);
}

function parseTimestamp(rawTimestamp: string, fileName: string): Date {
  const timestamp = parse(rawTimestamp, "yyyy-MM-dd HH:mm:ss.SSSSSS", new TZDate(0, "UTC"));
  if (!isValid(timestamp)) {
    throw new Error(`Timestamp non valido nella submission: ${fileName}`);
  }

  return timestamp;
}

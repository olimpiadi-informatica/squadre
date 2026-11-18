import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { isValid, parse } from "date-fns";
import { flatMapAsync, keyBy, limitAsync } from "es-toolkit";

import type { submission } from "~/lib/db/schema";
import { listRoundTasks } from "~/lib/task";
import type { TeamCredential } from "~/lib/team";

import { decodeSubmissionFile } from "./submission-file";

export type SkippedSubmission = {
  fileName: string;
  reason: string;
};

export async function processSubmissions(
  subsPath: string,
  editionId: string,
  roundSlug: string,
  teams: Record<string, TeamCredential>,
): Promise<{ submissions: (typeof submission.$inferInsert)[]; skipped: SkippedSubmission[] }> {
  const [regularTasks, juniorTasks, files] = await Promise.all([
    listRoundTasks(editionId, roundSlug, false),
    listRoundTasks(editionId, roundSlug, true),
    readdir(subsPath, { withFileTypes: true }),
  ]);

  const taskMaps = {
    regular: keyBy(regularTasks, (task) => task.slug),
    junior: keyBy(juniorTasks, (task) => task.slug),
  };

  const skipped: SkippedSubmission[] = [];

  const submissions = await flatMapAsync(
    files.filter((entry) => entry.isFile()),
    limitAsync(async (entry) => {
      const filePath = path.join(subsPath, entry.name);
      const decoded = decodeSubmissionFile(await readFile(filePath), entry.name);
      if (!decoded.ok) {
        skipped.push({ fileName: entry.name, reason: decoded.reason });
        return [];
      }

      const { metadata, code } = decoded;

      const match = /^(?<slug>\d+)\.\w+\.(?<language>\w+)$/u.exec(entry.name);
      if (!match?.groups) {
        throw new Error(`Nome submission non valido: ${entry.name}`);
      }

      const { slug, language } = match.groups;

      const team = teams[metadata.user];
      if (!team) return [];

      const task = team.junior
        ? taskMaps.junior[metadata.task.replace("_esordienti", "")]
        : taskMaps.regular[metadata.task];
      if (!task) {
        throw new Error(`Task non trovato per la submission: ${entry.name}`);
      }

      return [
        {
          slug,
          teamRoundId: team.teamRoundId,
          taskId: task.id,
          score: parseScore(metadata.score, entry.name),
          timestamp: parseTimestamp(metadata.date, entry.name),
          language,
          code,
        } satisfies typeof submission.$inferInsert,
      ];
    }, 64),
  );

  return { submissions, skipped: skipped.sort((a, b) => a.fileName.localeCompare(b.fileName)) };
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

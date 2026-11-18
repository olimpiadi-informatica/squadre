import { readdir } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";

import { and, eq, exists, gt, max, min } from "drizzle-orm";

import { db } from "./db";
import type { PenalizationLevel, PenalizationType } from "./db/schema";
import {
  institute,
  penalization,
  round,
  screenshot,
  submission,
  task,
  team,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
} from "./db/schema";
import { getRoundEndForTeam, getRoundStartForTeam } from "./round-config";

/**
 * Le registrazioni dello schermo non stanno nel database: sono file sul
 * server di gara. In locale finiscono in `screenshots/` (vedi
 * scripts/download-screenshots.sh); altrove si può puntare la variabile
 * SCREENSHOTS_DIR alla directory che le contiene.
 */
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR
  ? path.resolve(process.env.SCREENSHOTS_DIR)
  : path.join(process.cwd(), "screenshots");

/** Soglia oltre la quale due frame consecutivi sono considerati un buco. */
export const DEFAULT_GAP_THRESHOLD_MS = 60_000;

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SESSION_ID = /^[A-Za-z0-9]+$/u;
const FRAME_FILE = /^(?<seconds>\d+(?:\.\d+)?)\.(?:jpe?g|png)$/iu;

export type ScreenshotFrame = {
  /** Timestamp del frame in millisecondi (epoch). */
  ts: number;
  /** Nome del file, es. `1794839208.042.jpg`. */
  file: string;
};

export type ScreenshotGap = {
  startMs: number;
  endMs: number;
  durationMs: number;
  /**
   * `internal` è un'interruzione tra due frame, `start`/`end` sono i periodi
   * scoperti prima del primo frame o dopo l'ultimo (registrazione iniziata in
   * ritardo o terminata prima).
   */
  kind?: "internal" | "start" | "end";
};

export type ScreenshotSession = {
  /** Hash della sessione di registrazione (nome della directory). */
  id: string;
  frames: ScreenshotFrame[];
  gaps: ScreenshotGap[];
  medianIntervalMs: number;
  firstMs: number;
  lastMs: number;
};

export type RecordingWindow = {
  startMs: number;
  endMs: number;
};

/**
 * Periodo in cui la registrazione è effettivamente richiesta: dall'invio della
 * prima submission all'invio dell'ultima (come per i controlli internet).
 * Se non ci sono submission si usa l'intero round.
 */
export type RelevantWindow = RecordingWindow & {
  hasSubmissions: boolean;
};

export type RecordingSegment = {
  startMs: number;
  endMs: number;
  status: "recorded" | "gap" | "empty";
};

export type SessionRecordingStats = {
  session: ScreenshotSession;
  window: RecordingWindow;
  relevantWindow: RelevantWindow;
  segments: RecordingSegment[];
  gaps: ScreenshotGap[];
  framesInWindow: number;
  framesInRelevantWindow: number;
  firstFrameMs: number | null;
  lastFrameMs: number | null;
  recordedMs: number;
  missingMs: number;
  coverage: number;
  largestGapMs: number;
};

export type RecordingPenalization = {
  id: number;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
};

export type RecordingTeamSummary = {
  teamSlug: string;
  teamName: string;
  instituteName: string;
  instituteCity: string;
  delay: number;
  window: RecordingWindow;
  relevantWindow: RelevantWindow;
  sessions: ScreenshotSession[];
  sessionStats: SessionRecordingStats[];
  penalizations: RecordingPenalization[];
  totalFrames: number;
  numSessions: number;
  firstMs: number | null;
  lastMs: number | null;
  minCoverage: number;
  maxCoverage: number;
  largestGapMs: number;
  numGaps: number;
  hasIssues: boolean;
};

export const listScreenshotTeams = cache(async (): Promise<string[]> => {
  const entries = await readdir(SCREENSHOTS_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && SAFE_SEGMENT.test(entry.name))
    .map((entry) => entry.name)
    .sort();
});

export const getTeamScreenshotSessions = cache(
  async (
    teamRoundId: number | null | undefined,
    teamSlug: string,
    gapThresholdMs = DEFAULT_GAP_THRESHOLD_MS,
  ): Promise<ScreenshotSession[]> => {
    if (!SAFE_SEGMENT.test(teamSlug)) return [];

    if (teamRoundId != null) {
      const rows = await db
        .select({
          pcHash: screenshot.pcHash,
          ts: screenshot.ts,
          filename: screenshot.filename,
        })
        .from(screenshot)
        .where(eq(screenshot.teamRoundId, teamRoundId))
        .orderBy(screenshot.pcHash, screenshot.ts);

      if (rows.length > 0) {
        const framesByPc = new Map<string, ScreenshotFrame[]>();
        for (const row of rows) {
          const frames = framesByPc.get(row.pcHash) ?? [];
          frames.push({ ts: row.ts.getTime(), file: row.filename });
          framesByPc.set(row.pcHash, frames);
        }

        return [...framesByPc.entries()]
          .map(([pcHash, frames]) => buildSession(pcHash, frames, gapThresholdMs))
          .filter((session): session is ScreenshotSession => session !== null)
          .sort((a, b) => a.firstMs - b.firstMs || a.id.localeCompare(b.id));
      }
    }

    const teamDir = path.join(SCREENSHOTS_DIR, teamSlug);
    const entries = await readdir(teamDir, { withFileTypes: true }).catch(() => []);

    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && SESSION_ID.test(entry.name))
        .map(async (entry) =>
          readSession(path.join(teamDir, entry.name), entry.name, gapThresholdMs),
        ),
    );

    return sessions
      .filter((session): session is ScreenshotSession => session !== null)
      .sort((a, b) => a.firstMs - b.firstMs || a.id.localeCompare(b.id));
  },
);

async function readSession(
  dir: string,
  id: string,
  gapThresholdMs: number,
): Promise<ScreenshotSession | null> {
  const files = await readdir(dir).catch(() => []);

  const frames = files
    .map(parseFrame)
    .filter((frame): frame is ScreenshotFrame => frame !== null)
    .sort((a, b) => a.ts - b.ts);

  return buildSession(id, frames, gapThresholdMs);
}

function buildSession(
  id: string,
  frames: ScreenshotFrame[],
  gapThresholdMs: number,
): ScreenshotSession | null {
  if (frames.length === 0) return null;

  const sortedFrames = [...frames].sort((a, b) => a.ts - b.ts);
  const deltas = sortedFrames.slice(1).map((frame, index) => frame.ts - sortedFrames[index].ts);
  const medianIntervalMs = deltas.length > 0 ? median(deltas) : 10_000;

  const gaps: ScreenshotGap[] = [];
  for (let index = 0; index < sortedFrames.length - 1; index++) {
    const startMs = sortedFrames[index].ts;
    const endMs = sortedFrames[index + 1].ts;
    if (endMs - startMs > gapThresholdMs) {
      gaps.push({ startMs, endMs, durationMs: endMs - startMs });
    }
  }

  return {
    id,
    frames: sortedFrames,
    gaps,
    medianIntervalMs,
    firstMs: sortedFrames[0].ts,
    lastMs: sortedFrames[sortedFrames.length - 1].ts,
  };
}

function parseFrame(file: string): ScreenshotFrame | null {
  const match = FRAME_FILE.exec(file);
  if (!match?.groups?.seconds) return null;

  const seconds = Number(match.groups.seconds);
  if (!Number.isFinite(seconds)) return null;

  return { ts: Math.round(seconds * 1000), file };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function getRecordingWindow(
  roundRecord: Pick<typeof round.$inferSelect, "slug" | "startsAt" | "endsAt">,
  delaySeconds = 0,
): RecordingWindow {
  return {
    startMs: getRoundStartForTeam(roundRecord.startsAt, roundRecord.slug, delaySeconds).getTime(),
    endMs: getRoundEndForTeam(
      roundRecord.startsAt,
      roundRecord.endsAt,
      roundRecord.slug,
      delaySeconds,
    ).getTime(),
  };
}

/**
 * Periodo in cui la registrazione è richiesta. Come per i controlli internet,
 * prima della prima submission e dopo l'ultima non viene considerata mancante;
 * se non ci sono submission si usa l'intero round.
 */
export function getRelevantWindow(
  window: RecordingWindow,
  firstSubmission?: Date | null,
  lastSubmission?: Date | null,
): RelevantWindow {
  const contestStartMs = Math.min(window.startMs, window.endMs);
  const contestEndMs = Math.max(window.startMs, window.endMs);

  if (firstSubmission == null && lastSubmission == null) {
    return { startMs: contestStartMs, endMs: contestEndMs, hasSubmissions: false };
  }

  const startMs = firstSubmission
    ? clamp(firstSubmission.getTime(), contestStartMs, contestEndMs)
    : contestStartMs;
  const lastMs = lastSubmission
    ? clamp(lastSubmission.getTime(), contestStartMs, contestEndMs)
    : contestEndMs;

  return { startMs, endMs: Math.max(startMs, lastMs), hasSubmissions: true };
}

export function computeSessionRecordingStats(
  session: ScreenshotSession,
  window: RecordingWindow,
  gapThresholdMs = DEFAULT_GAP_THRESHOLD_MS,
  relevantWindow: RelevantWindow = {
    ...window,
    hasSubmissions: false,
  },
): SessionRecordingStats {
  const intervalMs = clamp(session.medianIntervalMs, 1_000, 60_000);
  const _thresholdMs = Math.max(gapThresholdMs, intervalMs * 2);
  const contestStartMs = Math.min(window.startMs, window.endMs);
  const contestEndMs = Math.max(window.startMs, window.endMs);
  const relevantStartMs = clamp(
    Math.min(relevantWindow.startMs, relevantWindow.endMs),
    contestStartMs,
    contestEndMs,
  );
  const relevantEndMs = clamp(
    Math.max(relevantWindow.startMs, relevantWindow.endMs),
    relevantStartMs,
    contestEndMs,
  );
  const relevantMs = Math.max(relevantEndMs - relevantStartMs, 0);

  // Come per i controlli internet (`CHECK_VALIDITY_SEC = 100` in
  // src/lib/result/internet.ts), ogni frame copre fino al successivo ma non
  // oltre la finestra di validità: in questo modo le due barre hanno la stessa
  // estensione anche prima della prima submission e dopo l'ultima.
  const validityMs = Math.max(gapThresholdMs, 100_000, intervalMs * 2);
  const framesDuringRace = session.frames.filter(
    (frame) => frame.ts >= contestStartMs && frame.ts <= contestEndMs,
  );
  const lastPreStartFrame = session.frames.findLast((frame) => frame.ts < contestStartMs);
  const effectiveFrames = [...framesDuringRace];
  if (lastPreStartFrame && lastPreStartFrame.ts + validityMs > contestStartMs) {
    effectiveFrames.unshift(lastPreStartFrame);
  }

  const recordedIntervals: [number, number][] = [];
  for (let index = 0; index < effectiveFrames.length; index++) {
    const frameStart = effectiveFrames[index].ts;
    const nextStart = effectiveFrames[index + 1]?.ts ?? contestEndMs;
    const segmentStart = Math.max(contestStartMs, frameStart);
    const segmentEnd = Math.min(contestEndMs, nextStart, frameStart + validityMs);
    if (segmentEnd > segmentStart) {
      recordedIntervals.push([segmentStart, segmentEnd]);
    }
  }

  const merged: [number, number][] = [];
  for (const [startMs, endMs] of recordedIntervals) {
    const last = merged[merged.length - 1];
    if (last && startMs <= last[1]) {
      last[1] = Math.max(last[1], endMs);
    } else {
      merged.push([startMs, endMs]);
    }
  }

  const segments: RecordingSegment[] = [];
  const gaps: ScreenshotGap[] = [];
  let cursor = contestStartMs;
  let hasRecorded = false;

  const pushGap = (gapStartMs: number, gapEndMs: number, kind: "start" | "internal" | "end") => {
    if (gapEndMs <= gapStartMs) return;

    if (kind === "start") {
      const emptyEnd = Math.min(gapEndMs, relevantStartMs);
      if (emptyEnd > gapStartMs) {
        segments.push({ startMs: gapStartMs, endMs: emptyEnd, status: "empty" });
      }
      const missingStart = Math.max(gapStartMs, relevantStartMs);
      if (gapEndMs > missingStart) {
        segments.push({ startMs: missingStart, endMs: gapEndMs, status: "gap" });
        gaps.push({
          startMs: missingStart,
          endMs: gapEndMs,
          durationMs: gapEndMs - missingStart,
          kind: "start",
        });
      }
      return;
    }

    const missingEnd = Math.min(gapEndMs, relevantEndMs);
    if (missingEnd > gapStartMs) {
      segments.push({ startMs: gapStartMs, endMs: missingEnd, status: "gap" });
      gaps.push({
        startMs: gapStartMs,
        endMs: missingEnd,
        durationMs: missingEnd - gapStartMs,
        kind,
      });
    }
    const emptyStart = Math.max(gapStartMs, relevantEndMs);
    if (gapEndMs > emptyStart) {
      segments.push({ startMs: emptyStart, endMs: gapEndMs, status: "empty" });
    }
  };

  for (const [startMs, endMs] of merged) {
    if (startMs > cursor) {
      pushGap(cursor, startMs, hasRecorded ? "internal" : "start");
    }
    segments.push({ startMs, endMs, status: "recorded" });
    hasRecorded = true;
    cursor = Math.max(cursor, endMs);
  }

  if (cursor < contestEndMs) {
    pushGap(cursor, contestEndMs, hasRecorded ? "end" : "start");
  }

  const missingMs = gaps.reduce((sum, gap) => sum + gap.durationMs, 0);
  const recordedMs = Math.max(relevantMs - missingMs, 0);

  const framesInWindow = session.frames.filter(
    (frame) => frame.ts >= contestStartMs && frame.ts <= contestEndMs,
  );
  const framesInRelevantWindow = session.frames.filter(
    (frame) => frame.ts >= relevantStartMs && frame.ts <= relevantEndMs,
  );

  return {
    session,
    window: { startMs: contestStartMs, endMs: contestEndMs },
    relevantWindow: {
      startMs: relevantStartMs,
      endMs: relevantEndMs,
      hasSubmissions: relevantWindow.hasSubmissions,
    },
    segments,
    gaps,
    framesInWindow: framesInWindow.length,
    framesInRelevantWindow: framesInRelevantWindow.length,
    firstFrameMs: framesInRelevantWindow[0]?.ts ?? null,
    lastFrameMs: framesInRelevantWindow[framesInRelevantWindow.length - 1]?.ts ?? null,
    recordedMs,
    missingMs,
    coverage: relevantMs > 0 ? clamp(recordedMs / relevantMs, 0, 1) : 1,
    largestGapMs: gaps.reduce((max, gap) => Math.max(max, gap.durationMs), 0),
  };
}

function summarizeTeam(
  base: {
    teamSlug: string;
    teamName: string;
    instituteName: string;
    instituteCity: string;
    delay: number;
    window: RecordingWindow;
    relevantWindow: RelevantWindow;
    sessions: ScreenshotSession[];
    penalizations: RecordingPenalization[];
  },
  gapThresholdMs: number,
): RecordingTeamSummary {
  const sessionStats = base.sessions.map((session) =>
    computeSessionRecordingStats(session, base.window, gapThresholdMs, base.relevantWindow),
  );

  const internalGaps = sessionStats.flatMap((stats) =>
    stats.gaps.filter((gap) => gap.kind === "internal"),
  );
  const coverages = sessionStats.map((stats) => stats.coverage);
  const firstFrames = sessionStats
    .map((stats) => stats.firstFrameMs)
    .filter((value): value is number => value !== null);
  const lastFrames = sessionStats
    .map((stats) => stats.lastFrameMs)
    .filter((value): value is number => value !== null);

  return {
    ...base,
    sessionStats,
    totalFrames: base.sessions.reduce((total, session) => total + session.frames.length, 0),
    numSessions: base.sessions.length,
    firstMs: firstFrames.length > 0 ? Math.min(...firstFrames) : null,
    lastMs: lastFrames.length > 0 ? Math.max(...lastFrames) : null,
    minCoverage: coverages.length > 0 ? Math.min(...coverages) : 0,
    maxCoverage: coverages.length > 0 ? Math.max(...coverages) : 0,
    largestGapMs: internalGaps.reduce((max, gap) => Math.max(max, gap.durationMs), 0),
    numGaps: internalGaps.length,
    hasIssues:
      base.sessions.length === 0 ||
      internalGaps.length > 0 ||
      sessionStats.some((stats) => stats.coverage < 0.9),
  };
}

type RecordingListOptions = {
  /** Considera solo le squadre che hanno una penalizzazione dei tipi indicati. */
  requirePenalty?: boolean;
  /** Filtra le penalizzazioni considerate per la selezione delle squadre. */
  penalizationTypes?: PenalizationType[];
};

export async function listRoundRecordings(
  editionId: string,
  roundSlug: string,
  gapThresholdMs = DEFAULT_GAP_THRESHOLD_MS,
  options: RecordingListOptions = {},
): Promise<RecordingTeamSummary[]> {
  const [roundRecord] = await db
    .select({
      id: round.id,
      slug: round.slug,
      startsAt: round.startsAt,
      endsAt: round.endsAt,
    })
    .from(round)
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));

  if (!roundRecord) return [];

  const [teams, penalties, submissionWindows, screenshotTeams, dbScreenshotTeams] =
    await Promise.all([
      db
        .select({
          teamSlug: team.slug,
          teamName: team.name,
          instituteName: institute.name,
          instituteCity: institute.city,
          delay: teamRound.delay,
          teamRoundId: teamRound.id,
        })
        .from(teamRound)
        .innerJoin(team, eq(team.id, teamRound.teamId))
        .innerJoin(round, eq(round.id, teamRound.roundId))
        .innerJoin(institute, eq(institute.id, team.instituteId))
        .where(
          and(
            eq(round.editionId, editionId),
            eq(round.slug, roundSlug),
            exists(
              db
                .select()
                .from(teamTaskScore)
                .innerJoin(task, eq(task.id, teamTaskScore.taskId))
                .where(
                  and(
                    eq(teamTaskScore.teamId, teamRound.teamId),
                    eq(task.roundId, teamRound.roundId),
                    gt(teamTaskScore.score, 0),
                  ),
                ),
            ),
          ),
        )
        .orderBy(institute.name, institute.city, team.name),
      db
        .select({
          teamSlug: team.slug,
          id: penalization.id,
          level: penalization.level,
          type: penalization.type,
          description: penalization.description,
        })
        .from(penalization)
        .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
        .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
        .innerJoin(team, eq(team.id, teamRound.teamId))
        .innerJoin(round, eq(round.id, teamRound.roundId))
        .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug))),
      db
        .select({
          teamSlug: team.slug,
          firstSubmission: min(submission.timestamp),
          lastSubmission: max(submission.timestamp),
        })
        .from(teamRound)
        .innerJoin(team, eq(team.id, teamRound.teamId))
        .innerJoin(round, eq(round.id, teamRound.roundId))
        .leftJoin(submission, eq(submission.teamRoundId, teamRound.id))
        .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
        .groupBy(team.slug),
      listScreenshotTeams(),
      db
        .selectDistinct({ teamSlug: team.slug })
        .from(screenshot)
        .innerJoin(teamRound, eq(teamRound.id, screenshot.teamRoundId))
        .innerJoin(team, eq(team.id, teamRound.teamId))
        .innerJoin(round, eq(round.id, teamRound.roundId))
        .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug))),
    ]);

  const submissionWindowByTeam = new Map(
    submissionWindows.map((item) => [item.teamSlug, item] as const),
  );

  const penaltyByTeam = new Map<string, RecordingPenalization[]>();
  for (const item of penalties) {
    const list = penaltyByTeam.get(item.teamSlug) ?? [];
    list.push({
      id: item.id,
      level: item.level,
      type: item.type,
      description: item.description,
    });
    penaltyByTeam.set(item.teamSlug, list);
  }

  const available = new Set([
    ...screenshotTeams,
    ...dbScreenshotTeams.map((item) => item.teamSlug),
  ]);
  const candidates = teams.filter((item) => {
    const teamPenalties = penaltyByTeam.get(item.teamSlug) ?? [];
    const relevantPenalties = options.penalizationTypes
      ? teamPenalties.filter((penalty) => options.penalizationTypes?.includes(penalty.type))
      : teamPenalties;

    if (options.requirePenalty) {
      return relevantPenalties.length > 0;
    }

    return available.has(item.teamSlug) || relevantPenalties.length > 0;
  });

  return Promise.all(
    candidates.map(async (item) => {
      const sessions = available.has(item.teamSlug)
        ? await getTeamScreenshotSessions(item.teamRoundId, item.teamSlug, gapThresholdMs)
        : [];
      const window = getRecordingWindow(roundRecord, item.delay);
      const submissionWindow = submissionWindowByTeam.get(item.teamSlug);

      return summarizeTeam(
        {
          ...item,
          window,
          relevantWindow: getRelevantWindow(
            window,
            submissionWindow?.firstSubmission ?? null,
            submissionWindow?.lastSubmission ?? null,
          ),
          sessions,
          penalizations: penaltyByTeam.get(item.teamSlug) ?? [],
        },
        gapThresholdMs,
      );
    }),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

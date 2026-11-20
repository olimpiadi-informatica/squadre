import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";

import { and, eq, exists, gt, inArray, max, min, sql } from "drizzle-orm";

import { db } from "./db";
import type { PenalizationLevel, PenalizationType } from "./db/schema";
import {
  institute,
  internetCheck,
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
import {
  getProctoringUnavailable,
  mergeWindows,
  overlapMs,
  splitWindow,
  type TimeWindow,
  unavailableForTeam,
} from "./proctoring-unavailable";
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
  /** Timestamp dei frame in millisecondi (epoch), in ordine crescente. */
  frames: number[];
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
  status: "recorded" | "gap" | "empty" | "unavailable";
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
  unavailableMs: number;
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
  /**
   * PC che hanno fatto controlli internet ma non hanno mai inviato un frame:
   * senza questa lista una registrazione completamente assente non comparirebbe
   * da nessuna parte (non esiste nessuna sessione da cui accorgersene).
   */
  missingPcs: string[];
  monitoredPcs: string[];
  totalFrames: number;
  numSessions: number;
  firstMs: number | null;
  lastMs: number | null;
  minCoverage: number;
  maxCoverage: number;
  largestGapMs: number;
  numGaps: number;
  unavailableMs: number;
  /** Somma del tempo mancante di tutti i PC (non il massimo). */
  missingMs: number;
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
        })
        .from(screenshot)
        .where(eq(screenshot.teamRoundId, teamRoundId))
        .orderBy(screenshot.pcHash, screenshot.ts);

      if (rows.length > 0) {
        const framesByPc = new Map<string, number[]>();
        for (const row of rows) {
          const frames = framesByPc.get(row.pcHash) ?? [];
          frames.push(row.ts.getTime());
          framesByPc.set(row.pcHash, frames);
        }

        return [...framesByPc.entries()]
          .map(([pcHash, frames]) => buildSession(pcHash, frames, gapThresholdMs))
          .filter((session): session is ScreenshotSession => session !== null)
          .sort((a, b) => a.firstMs - b.firstMs || a.id.localeCompare(b.id));
      }
    }

    return getTeamFileSystemSessions(teamSlug, gapThresholdMs);
  },
);

/**
 * Sessioni lette da `SCREENSHOTS_DIR` quando i metadati non sono nel database
 * (es. registrazioni scaricate localmente). Il resto della pagina usa
 * `getRoundScreenshotSessions`, che carica tutto il round con una sola query.
 */
async function getTeamFileSystemSessions(
  teamSlug: string,
  gapThresholdMs = DEFAULT_GAP_THRESHOLD_MS,
): Promise<ScreenshotSession[]> {
  if (!SAFE_SEGMENT.test(teamSlug)) return [];

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
}

/**
 * Sessioni di tutte le squadre indicate, in una sola query: per ogni
 * registrazione (una per PC) si prendono solo i timestamp dei frame.
 * Evita la query per squadra che rendeva lenta la pagina di proctoring.
 */
export async function getRoundScreenshotSessions(
  teamRoundIds: number[],
  gapThresholdMs = DEFAULT_GAP_THRESHOLD_MS,
): Promise<Map<number, ScreenshotSession[]>> {
  const sessionsByTeamRound = new Map<number, ScreenshotSession[]>();
  if (teamRoundIds.length === 0) return sessionsByTeamRound;

  const rows = await db
    .select({
      teamRoundId: screenshot.teamRoundId,
      pcHash: screenshot.pcHash,
      // `date_part` restituisce direttamente `float8`, mentre
      // `EXTRACT(EPOCH ...)` produce un `numeric`: su centinaia di migliaia di
      // righe la differenza è di centinaia di millisecondi.
      frames: sql<
        number[]
      >`ARRAY_AGG(ROUND(date_part('epoch', ${screenshot.ts}) * 1000) ORDER BY ${screenshot.ts})`,
    })
    .from(screenshot)
    .where(inArray(screenshot.teamRoundId, teamRoundIds))
    .groupBy(screenshot.teamRoundId, screenshot.pcHash);

  const framesByTeamRound = new Map<number, Map<string, number[]>>();
  for (const row of rows) {
    let framesByPc = framesByTeamRound.get(row.teamRoundId);
    if (!framesByPc) {
      framesByPc = new Map();
      framesByTeamRound.set(row.teamRoundId, framesByPc);
    }
    framesByPc.set(row.pcHash, row.frames);
  }

  for (const [teamRoundId, framesByPc] of framesByTeamRound) {
    sessionsByTeamRound.set(
      teamRoundId,
      [...framesByPc.entries()]
        .map(([pcHash, frames]) => buildSession(pcHash, frames, gapThresholdMs))
        .filter((session): session is ScreenshotSession => session !== null)
        .sort((a, b) => a.firstMs - b.firstMs || a.id.localeCompare(b.id)),
    );
  }

  return sessionsByTeamRound;
}

async function readSession(
  dir: string,
  id: string,
  gapThresholdMs: number,
): Promise<ScreenshotSession | null> {
  const files = await readdir(dir).catch(() => []);

  const frames = files
    .map(parseFrame)
    .filter((ts): ts is number => ts !== null)
    .sort((a, b) => a - b);

  return buildSession(id, frames, gapThresholdMs);
}

function buildSession(
  id: string,
  frames: number[],
  gapThresholdMs: number,
): ScreenshotSession | null {
  if (frames.length === 0) return null;

  const sortedFrames = [...frames].sort((a, b) => a - b);
  const deltas = sortedFrames.slice(1).map((ts, index) => ts - sortedFrames[index]);
  const medianIntervalMs = deltas.length > 0 ? median(deltas) : 10_000;

  const gaps: ScreenshotGap[] = [];
  for (let index = 0; index < sortedFrames.length - 1; index++) {
    const startMs = sortedFrames[index];
    const endMs = sortedFrames[index + 1];
    if (endMs - startMs > gapThresholdMs) {
      gaps.push({ startMs, endMs, durationMs: endMs - startMs });
    }
  }

  return {
    id,
    frames: sortedFrames,
    gaps,
    medianIntervalMs,
    firstMs: sortedFrames[0],
    lastMs: sortedFrames[sortedFrames.length - 1],
  };
}

/**
 * Timestamp scritto nel nome del frame. È l'orologio del PC della squadra (non
 * l'ora di arrivo al server, che è `screenshot.ts`): serve per ritrovare il
 * frame indicato nel verbale.
 */
export function parseFrameTimestamp(filename: string): number | null {
  const match = FRAME_FILE.exec(filename);
  if (!match?.groups?.seconds) return null;

  const seconds = Number(match.groups.seconds);
  if (!Number.isFinite(seconds)) return null;

  return Math.round(seconds * 1000);
}

function parseFrame(file: string): number | null {
  return parseFrameTimestamp(file);
}

export type ScreenshotFile = {
  data: Buffer;
  contentType: string;
};

/**
 * Legge dal filesystem il frame indicato dai metadati. I segmenti di percorso
 * vengono validati prima di toccare il disco: `pcHash` e `filename` arrivano
 * dai log di proctoring e non sono fidati.
 */
export async function readScreenshotFile(screenshotId: number): Promise<ScreenshotFile | null> {
  const [row] = await db
    .select({
      teamSlug: team.slug,
      pcHash: screenshot.pcHash,
      filename: screenshot.filename,
    })
    .from(screenshot)
    .innerJoin(teamRound, eq(teamRound.id, screenshot.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .where(eq(screenshot.id, screenshotId));

  if (!row) return null;
  if (!SAFE_SEGMENT.test(row.teamSlug) || !SESSION_ID.test(row.pcHash)) return null;
  if (path.basename(row.filename) !== row.filename || !FRAME_FILE.test(row.filename)) return null;

  const data = await readFile(
    path.join(SCREENSHOTS_DIR, row.teamSlug, row.pcHash, row.filename),
  ).catch(() => null);
  if (!data) return null;

  return {
    data,
    contentType: /\.png$/iu.test(row.filename) ? "image/png" : "image/jpeg",
  };
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
  unavailableWindows: TimeWindow[] = [],
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
    (ts) => ts >= contestStartMs && ts <= contestEndMs,
  );
  const lastPreStartFrame = session.frames.findLast((ts) => ts < contestStartMs);
  const effectiveFrames = [...framesDuringRace];
  if (lastPreStartFrame != null && lastPreStartFrame + validityMs > contestStartMs) {
    effectiveFrames.unshift(lastPreStartFrame);
  }

  const recordedIntervals: [number, number][] = [];
  for (let index = 0; index < effectiveFrames.length; index++) {
    const frameStart = effectiveFrames[index];
    const nextStart = effectiveFrames[index + 1] ?? contestEndMs;
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

  // Finestre in cui il proctoring non stava raccogliendo: i buchi che ci cadono
  // dentro non sono colpa della squadra.
  const unavailable = mergeWindows(unavailableWindows);

  const pushMissing = (startMs: number, endMs: number, kind: "start" | "internal" | "end") => {
    for (const piece of splitWindow(startMs, endMs, unavailable)) {
      if (piece.unavailable) {
        segments.push({ startMs: piece.startMs, endMs: piece.endMs, status: "unavailable" });
        continue;
      }
      segments.push({ startMs: piece.startMs, endMs: piece.endMs, status: "gap" });
      gaps.push({
        startMs: piece.startMs,
        endMs: piece.endMs,
        durationMs: piece.endMs - piece.startMs,
        kind,
      });
    }
  };

  const pushGap = (gapStartMs: number, gapEndMs: number, kind: "start" | "internal" | "end") => {
    if (gapEndMs <= gapStartMs) return;

    if (kind === "start") {
      const emptyEnd = Math.min(gapEndMs, relevantStartMs);
      if (emptyEnd > gapStartMs) {
        segments.push({ startMs: gapStartMs, endMs: emptyEnd, status: "empty" });
      }
      const missingStart = Math.max(gapStartMs, relevantStartMs);
      if (gapEndMs > missingStart) {
        pushMissing(missingStart, gapEndMs, "start");
      }
      return;
    }

    const missingEnd = Math.min(gapEndMs, relevantEndMs);
    if (missingEnd > gapStartMs) {
      pushMissing(gapStartMs, missingEnd, kind);
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
  const unavailableMs = overlapMs(relevantStartMs, relevantEndMs, unavailable);
  const availableMs = Math.max(relevantMs - unavailableMs, 0);
  const recordedMs = Math.max(availableMs - missingMs, 0);

  const timestampedSegments: RecordingSegment[] = segments.flatMap((segment) =>
    splitWindow(segment.startMs, segment.endMs, unavailable).map((piece) => ({
      startMs: piece.startMs,
      endMs: piece.endMs,
      status: piece.unavailable ? ("unavailable" as const) : segment.status,
    })),
  );

  const framesInWindow = session.frames.filter((ts) => ts >= contestStartMs && ts <= contestEndMs);
  const framesInRelevantWindow = session.frames.filter(
    (ts) => ts >= relevantStartMs && ts <= relevantEndMs,
  );

  return {
    session,
    window: { startMs: contestStartMs, endMs: contestEndMs },
    relevantWindow: {
      startMs: relevantStartMs,
      endMs: relevantEndMs,
      hasSubmissions: relevantWindow.hasSubmissions,
    },
    segments: timestampedSegments,
    gaps,
    framesInWindow: framesInWindow.length,
    framesInRelevantWindow: framesInRelevantWindow.length,
    firstFrameMs: framesInRelevantWindow[0] ?? null,
    lastFrameMs: framesInRelevantWindow[framesInRelevantWindow.length - 1] ?? null,
    recordedMs,
    missingMs,
    unavailableMs,
    coverage: availableMs > 0 ? clamp(recordedMs / availableMs, 0, 1) : 1,
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
    monitoredPcs: string[];
    penalizations: RecordingPenalization[];
    unavailable: TimeWindow[];
  },
  gapThresholdMs: number,
): RecordingTeamSummary {
  const sessionStats = base.sessions.map((session) =>
    computeSessionRecordingStats(
      session,
      base.window,
      gapThresholdMs,
      base.relevantWindow,
      base.unavailable,
    ),
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

  const unavailableMs = overlapMs(
    base.relevantWindow.startMs,
    base.relevantWindow.endMs,
    base.unavailable,
  );
  const availableMs = Math.max(
    base.relevantWindow.endMs - base.relevantWindow.startMs - unavailableMs,
    0,
  );

  const recordedPcs = new Set(base.sessions.map((session) => session.id));
  const missingPcs = base.monitoredPcs.filter((pcHash) => !recordedPcs.has(pcHash));
  // Senza PC monitorati né frame non si sa quanti PC ci fossero: se ne assume
  // uno, così "nessuna registrazione" resta conteggiata come tale.
  const missingPcCount = Math.max(missingPcs.length, base.sessions.length === 0 ? 1 : 0);
  const missingMs =
    sessionStats.reduce((sum, stats) => sum + stats.missingMs, 0) + missingPcCount * availableMs;

  return {
    ...base,
    sessionStats,
    missingPcs,
    missingMs,
    totalFrames: base.sessions.reduce((total, session) => total + session.frames.length, 0),
    numSessions: base.sessions.length,
    firstMs: firstFrames.length > 0 ? Math.min(...firstFrames) : null,
    lastMs: lastFrames.length > 0 ? Math.max(...lastFrames) : null,
    minCoverage: coverages.length > 0 ? Math.min(...coverages) : 0,
    maxCoverage: coverages.length > 0 ? Math.max(...coverages) : 0,
    largestGapMs: internalGaps.reduce((max, gap) => Math.max(max, gap.durationMs), 0),
    numGaps: internalGaps.length,
    unavailableMs,
    hasIssues:
      base.sessions.length === 0 ||
      missingPcs.length > 0 ||
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

  const [
    teams,
    penalties,
    submissionWindows,
    screenshotTeams,
    dbScreenshotTeams,
    monitoredPcs,
    unavailable,
  ] = await Promise.all([
    db
      .select({
        teamId: team.id,
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
    // I PC che hanno fatto controlli internet: se uno non ha frame la sua
    // registrazione manca del tutto e va contata come tale.
    db
      .selectDistinct({
        teamRoundId: internetCheck.teamRoundId,
        pcHash: internetCheck.pcHash,
      })
      .from(internetCheck)
      .innerJoin(teamRound, eq(teamRound.id, internetCheck.teamRoundId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug))),
    getProctoringUnavailable(roundRecord.id),
  ]);

  const monitoredPcsByTeamRound = new Map<number, string[]>();
  for (const item of monitoredPcs) {
    const list = monitoredPcsByTeamRound.get(item.teamRoundId) ?? [];
    list.push(item.pcHash);
    monitoredPcsByTeamRound.set(item.teamRoundId, list);
  }

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

  // Le sessioni di tutte le squadre vengono caricate in un colpo solo: una
  // query per squadra (erano ~550) dominava il tempo di caricamento.
  const sessionsByTeamRound = await getRoundScreenshotSessions(
    candidates.map((item) => item.teamRoundId),
    gapThresholdMs,
  );
  const fileSystemTeams = new Set(screenshotTeams);

  return Promise.all(
    candidates.map(async (item) => {
      const sessions =
        sessionsByTeamRound.get(item.teamRoundId) ??
        (fileSystemTeams.has(item.teamSlug)
          ? await getTeamFileSystemSessions(item.teamSlug, gapThresholdMs)
          : []);
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
          monitoredPcs: monitoredPcsByTeamRound.get(item.teamRoundId) ?? [],
          penalizations: penaltyByTeam.get(item.teamSlug) ?? [],
          unavailable: unavailableForTeam(unavailable, item.teamId),
        },
        gapThresholdMs,
      );
    }),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

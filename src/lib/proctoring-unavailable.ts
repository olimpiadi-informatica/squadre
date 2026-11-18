import { eq } from "drizzle-orm";

import { db } from "./db";
import { proctoringUnavailable } from "./db/schema";

/** Intervallo `[startMs, endMs)` in millisecondi epoch. */
export type TimeWindow = { startMs: number; endMs: number };

export type ProctoringUnavailable = {
  /** Finestre valide per tutto il round. */
  round: TimeWindow[];
  /** Finestre aggiuntive per singola squadra. */
  byTeam: Map<number, TimeWindow[]>;
};

/** Finestre valide per una squadra: quelle del round più le sue. */
export function unavailableForTeam(
  unavailable: ProctoringUnavailable,
  teamId: number,
): TimeWindow[] {
  return mergeWindows([...unavailable.round, ...(unavailable.byTeam.get(teamId) ?? [])]);
}

export async function getProctoringUnavailable(roundId: number): Promise<ProctoringUnavailable> {
  const rows = await db
    .select({
      teamId: proctoringUnavailable.teamId,
      startTs: proctoringUnavailable.startTs,
      endTs: proctoringUnavailable.endTs,
    })
    .from(proctoringUnavailable)
    .where(eq(proctoringUnavailable.roundId, roundId));

  const round: TimeWindow[] = [];
  const byTeam = new Map<number, TimeWindow[]>();

  for (const row of rows) {
    const window = { startMs: row.startTs.getTime(), endMs: row.endTs.getTime() };
    if (window.endMs <= window.startMs) continue;

    if (row.teamId == null) {
      round.push(window);
    } else {
      const list = byTeam.get(row.teamId) ?? [];
      list.push(window);
      byTeam.set(row.teamId, list);
    }
  }

  return {
    round: mergeWindows(round),
    byTeam: new Map([...byTeam].map(([teamId, windows]) => [teamId, mergeWindows(windows)])),
  };
}

/** Unisce le finestre sovrapposte o adiacenti e le ordina. */
export function mergeWindows(windows: TimeWindow[]): TimeWindow[] {
  const sorted = windows
    .filter((window) => window.endMs > window.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  const merged: TimeWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && window.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, window.endMs);
    } else {
      merged.push({ ...window });
    }
  }

  return merged;
}

export type WindowPiece = { startMs: number; endMs: number; unavailable: boolean };

/**
 * Spezza `[startMs, endMs)` nelle parti coperte e non coperte dalle finestre,
 * che devono essere già unite e ordinate (vedi `mergeWindows`).
 */
export function splitWindow(startMs: number, endMs: number, windows: TimeWindow[]): WindowPiece[] {
  if (endMs <= startMs) return [];

  const pieces: WindowPiece[] = [];
  let cursor = startMs;

  for (const window of windows) {
    if (window.endMs <= cursor) continue;
    if (window.startMs >= endMs) break;

    if (window.startMs > cursor) {
      pieces.push({ startMs: cursor, endMs: Math.min(window.startMs, endMs), unavailable: false });
    }

    const overlapEnd = Math.min(window.endMs, endMs);
    if (overlapEnd > cursor) {
      pieces.push({
        startMs: Math.max(cursor, window.startMs),
        endMs: overlapEnd,
        unavailable: true,
      });
      cursor = overlapEnd;
    }

    if (cursor >= endMs) break;
  }

  if (cursor < endMs) {
    pieces.push({ startMs: cursor, endMs, unavailable: false });
  }

  return pieces;
}

/** Millisecondi di `[startMs, endMs)` coperti dalle finestre. */
export function overlapMs(startMs: number, endMs: number, windows: TimeWindow[]): number {
  return splitWindow(startMs, endMs, windows).reduce(
    (total, piece) => (piece.unavailable ? total + (piece.endMs - piece.startMs) : total),
    0,
  );
}

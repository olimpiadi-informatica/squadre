import { cache } from "react";

import { and, avg, count, eq, gt, min, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, round, roundScore } from "~/lib/db/schema";
import { coalesce, median } from "~/lib/utils";

export type Round = {
  id: string;
  name: string;
  editionId: string;
  editionName: string;
};

export const getRound = cache(
  async (editionId: string, roundId: string): Promise<Round | undefined> => {
    const [result] = await db
      .select({
        id: round.id,
        name: round.title,
        editionId: round.editionId,
        editionName: edition.title,
      })
      .from(round)
      .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, 1)))
      .where(and(eq(round.editionId, editionId), eq(round.id, roundId), eq(round.public, 1)));
    return result;
  },
);

export type RoundStats = {
  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export const getRoundStats = cache(
  async (editionId: string, roundId: string): Promise<RoundStats> => {
    const [result] = await db
      .select({
        teamScored: count(),
        totalScores: coalesce(sum(roundScore.score), 0),
        maxScore: coalesce(min(roundScore.score), 0),
        avgScore: coalesce(avg(roundScore.score), 0),
        medianScore: coalesce(median(roundScore.score), 0),
      })
      .from(roundScore)
      .innerJoin(edition, and(eq(roundScore.editionId, edition.id), eq(edition.public, 1)))
      .innerJoin(
        round,
        and(
          eq(roundScore.roundId, round.id),
          eq(roundScore.editionId, round.editionId),
          eq(round.public, 1),
        ),
      )
      .where(
        and(
          eq(roundScore.editionId, editionId),
          eq(roundScore.roundId, roundId),
          gt(roundScore.score, 0),
        ),
      );
    return result;
  },
);

export type RoundItem = {
  id: string;
  name: string;
  editionId: string;
  maxScore: number;
};

export const listRounds = cache((editionId?: string): Promise<RoundItem[]> => {
  return db
    .select({
      id: round.id,
      name: round.title,
      editionId: round.editionId,
      maxScore: round.fullscore,
    })
    .from(round)
    .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, 1)))
    .where(and(eq(round.editionId, editionId ?? "").if(editionId), eq(round.public, 1)))
    .orderBy(round.title);
});

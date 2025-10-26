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

export const getRound = cache(async (editionId: string, roundId: string): Promise<Round> => {
  const [result] = await db
    .select({
      id: round.id,
      name: round.title,
      editionId: round.editionId,
      editionName: edition.title,
    })
    .from(round)
    .innerJoin(edition, eq(round.editionId, edition.id))
    .where(and(eq(round.editionId, editionId), eq(round.id, roundId)));
  if (!result) throw new Error(`Round ${editionId}-${roundId} not found`);
  return result;
});

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
    .where(eq(round.editionId, editionId ?? "").if(editionId))
    .orderBy(round.title);
});

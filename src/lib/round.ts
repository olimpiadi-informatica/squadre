import { cache } from "react";

import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { edition, round, v03b_roundStats } from "./db/schema";

export type RoundAdminItem = {
  id: number;
  slug: string;
  title: string;
  editionId: string;
  startsAt: Date;
  public: boolean;
};

export async function updateRoundVisibility(
  editionId: string,
  roundSlug: string,
  isPublic: boolean,
): Promise<void> {
  await db
    .update(round)
    .set({ public: isPublic })
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));
}

export const listRoundsAdmin = cache(
  (editionId: string, roundSlug?: string): Promise<RoundAdminItem[]> => {
    return db
      .select({
        id: round.id,
        slug: round.slug,
        title: round.title,
        editionId: round.editionId,
        startsAt: round.startsAt,
        public: round.public,
      })
      .from(round)
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug ?? "").if(roundSlug)))
      .orderBy(round.startsAt, round.slug);
  },
);

export const getRoundAdmin = cache(
  async (editionId: string, roundSlug: string): Promise<RoundAdminItem | undefined> => {
    const [result] = await listRoundsAdmin(editionId, roundSlug);
    return result;
  },
);

export type Round = {
  slug: string;
  name: string;
  editionId: string;
  editionName: string;

  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export const getRound = cache(
  async (editionId: string, roundSlug: string): Promise<Round | undefined> => {
    const [result] = await db
      .select({
        slug: round.slug,
        name: round.title,
        editionId: edition.id,
        editionName: edition.title,

        teamScored: v03b_roundStats.teamScored,
        totalScores: v03b_roundStats.totalScores,
        maxScore: v03b_roundStats.maxScore,
        avgScore: v03b_roundStats.avgScore,
        medianScore: v03b_roundStats.medianScore,
      })
      .from(round)
      .innerJoin(v03b_roundStats, eq(v03b_roundStats.roundId, round.id))
      .innerJoin(edition, eq(edition.id, round.editionId))
      .where(and(eq(edition.id, editionId), eq(round.slug, roundSlug)));
    return result;
  },
);

export type RoundItem = {
  id: string;
  name: string;
  editionId: string;
  maxScore: number;
  public: boolean;
};

export const listAllRounds = cache((editionId?: string): Promise<RoundItem[]> => {
  return db
    .select({
      id: round.slug,
      name: round.title,
      editionId: round.editionId,
      maxScore: round.fullscore,
      public: round.public,
    })
    .from(round)
    .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, true)))
    .where(eq(round.editionId, editionId ?? "").if(editionId))
    .orderBy(round.title);
});

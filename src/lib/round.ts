import { cache } from "react";

import { and, avg, count, eq, gt, min, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, round, team, teamRound } from "~/lib/db/schema";
import { coalesce, median } from "~/lib/utils";

export type RoundAdminItem = {
  id: string;
  title: string;
  editionId: string;
  startsAt: Date;
  public: boolean;
};

export async function updateRoundVisibility(
  editionId: string,
  roundId: string,
  isPublic: boolean,
): Promise<void> {
  await db
    .update(round)
    .set({ public: isPublic })
    .where(and(eq(round.editionId, editionId), eq(round.id, roundId)));
}

export const getRoundAdmin = cache(
  async (editionId: string, roundId: string): Promise<RoundAdminItem | undefined> => {
    const [result] = await db
      .select({
        id: round.id,
        title: round.title,
        editionId: round.editionId,
        startsAt: round.startsAt,
        public: round.public,
      })
      .from(round)
      .where(and(eq(round.editionId, editionId), eq(round.id, roundId)));
    return result;
  },
);

export const listRoundsAdmin = cache((editionId: string): Promise<RoundAdminItem[]> => {
  return db
    .select({
      id: round.id,
      title: round.title,
      editionId: round.editionId,
      startsAt: round.startsAt,
      public: round.public,
    })
    .from(round)
    .where(eq(round.editionId, editionId))
    .orderBy(round.startsAt, round.id);
});

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
      .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, true)))
      .where(and(eq(round.editionId, editionId), eq(round.id, roundId), eq(round.public, true)));
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
        totalScores: coalesce(sum(teamRound.score), 0),
        maxScore: coalesce(min(teamRound.score), 0),
        avgScore: coalesce(avg(teamRound.score), 0),
        medianScore: coalesce(median(teamRound.score), 0),
      })
      .from(teamRound)
      .innerJoin(edition, and(eq(teamRound.editionId, edition.id), eq(edition.public, true)))
      .innerJoin(
        round,
        and(
          eq(teamRound.roundId, round.id),
          eq(teamRound.editionId, round.editionId),
          eq(round.public, true),
        ),
      )
      .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
      .where(
        and(
          eq(teamRound.editionId, editionId),
          eq(teamRound.roundId, roundId),
          gt(teamRound.score, 0),
          eq(team.junior, false),
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
  public: boolean;
};

export const listAllRounds = cache((editionId?: string): Promise<RoundItem[]> => {
  return db
    .select({
      id: round.id,
      name: round.title,
      editionId: round.editionId,
      maxScore: round.fullscore,
      public: round.public,
    })
    .from(round)
    .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, true)))
    .where(eq(round.editionId, editionId ?? ""))
    .orderBy(round.title);
});

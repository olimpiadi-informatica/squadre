import { cache } from "react";

import {
  and,
  count,
  countDistinct,
  eq,
  isNotNull,
  isNull,
  lte,
  notExists,
  or,
  sql,
} from "drizzle-orm";

import { db } from "./db";
import {
  credentialEmail,
  edition,
  email as emailTable,
  penalization,
  penalizedRound,
  penalizedTeamRound,
  round,
  task,
  team,
  teamRound,
  teamRoundPenalization,
  v03b_roundStats,
} from "./db/schema";

export type RoundAdminItem = {
  id: number;
  slug: string;
  title: string;
  editionId: string;
  startsAt: Date;
  endsAt: Date;
  public: boolean;
  schoolCount: number;
  teamCount: number;
  taskCount: number;
  sentEmailCount: number;
};

export const listRoundsAdmin = cache(
  (editionId: string, roundSlug?: string): Promise<RoundAdminItem[]> => {
    return db
      .select({
        id: round.id,
        slug: round.slug,
        title: round.title,
        editionId: round.editionId,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
        public: round.public,
        schoolCount: sql<number>`${db
          .select({ value: countDistinct(team.instituteId) })
          .from(teamRound)
          .innerJoin(team, eq(team.id, teamRound.teamId))
          .where(
            and(
              eq(teamRound.roundId, round.id),
              notExists(
                db
                  .select({ id: penalizedTeamRound.id })
                  .from(penalizedTeamRound)
                  .innerJoin(penalizedRound, eq(penalizedRound.id, penalizedTeamRound.roundId))
                  .innerJoin(
                    teamRoundPenalization,
                    eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
                  )
                  .innerJoin(
                    penalization,
                    eq(penalization.id, teamRoundPenalization.penalizationId),
                  )
                  .where(
                    and(
                      eq(penalizedTeamRound.teamId, team.id),
                      eq(penalization.level, "red"),
                      isNotNull(penalization.sentAt),
                      or(
                        isNull(penalization.appealApproved),
                        eq(penalization.appealApproved, false),
                      ),
                      lte(penalizedRound.startsAt, round.startsAt),
                    ),
                  ),
              ),
            ),
          )}`,
        teamCount: sql<number>`${db
          .select({ value: count() })
          .from(teamRound)
          .innerJoin(team, eq(team.id, teamRound.teamId))
          .where(
            and(
              eq(teamRound.roundId, round.id),
              notExists(
                db
                  .select({ id: penalizedTeamRound.id })
                  .from(penalizedTeamRound)
                  .innerJoin(penalizedRound, eq(penalizedRound.id, penalizedTeamRound.roundId))
                  .innerJoin(
                    teamRoundPenalization,
                    eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
                  )
                  .innerJoin(
                    penalization,
                    eq(penalization.id, teamRoundPenalization.penalizationId),
                  )
                  .where(
                    and(
                      eq(penalizedTeamRound.teamId, team.id),
                      eq(penalization.level, "red"),
                      isNotNull(penalization.sentAt),
                      or(
                        isNull(penalization.appealApproved),
                        eq(penalization.appealApproved, false),
                      ),
                      lte(penalizedRound.startsAt, round.startsAt),
                    ),
                  ),
              ),
            ),
          )}`,
        taskCount: db.$count(task, eq(task.roundId, round.id)),
        sentEmailCount: sql<number>`${db
          .select({ value: count() })
          .from(credentialEmail)
          .innerJoin(emailTable, eq(emailTable.id, credentialEmail.emailId))
          .where(and(eq(credentialEmail.roundId, round.id), eq(emailTable.status, "sent")))}`,
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
    .where(and(eq(round.editionId, editionId ?? "").if(editionId), eq(round.public, true)))
    .orderBy(round.startsAt, round.slug);
});

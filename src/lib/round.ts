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

import { sortChampionships } from "./championship";
import { db } from "./db";
import { penalizedRound, penalizedTeamRound } from "./db/aliases";
import {
  credentialEmail,
  edition,
  email as emailTable,
  penalization,
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

export type RoundStats = {
  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export type Round = {
  slug: string;
  name: string;
  editionId: string;
  editionName: string;
  /**
   * Le statistiche del round per ciascun campionato che vi ha gareggiato: i
   * round con classifiche parallele (OIS 11-15) ne hanno più di una.
   */
  championships: { championship: string; stats: RoundStats }[];
};

export const getRound = cache(
  async (editionId: string, roundSlug: string): Promise<Round | undefined> => {
    const [base] = await db
      .select({
        slug: round.slug,
        name: round.title,
        editionId: edition.id,
        editionName: edition.title,
        roundId: round.id,
      })
      .from(round)
      .innerJoin(edition, eq(edition.id, round.editionId))
      .where(and(eq(edition.id, editionId), eq(round.slug, roundSlug)));
    if (!base) return undefined;

    const stats = await db
      .select({
        championship: v03b_roundStats.championship,
        teamScored: v03b_roundStats.teamScored,
        totalScores: v03b_roundStats.totalScores,
        maxScore: v03b_roundStats.maxScore,
        avgScore: v03b_roundStats.avgScore,
        medianScore: v03b_roundStats.medianScore,
      })
      .from(v03b_roundStats)
      .where(eq(v03b_roundStats.roundId, base.roundId));
    if (stats.length === 0) return undefined;

    const { roundId, ...rest } = base;
    const byChampionship = new Map(stats.map((row) => [row.championship, row]));
    return {
      ...rest,
      // ordine dei tab: prima i regolari
      championships: sortChampionships([...byChampionship.keys()]).flatMap((championship) => {
        const row = byChampionship.get(championship);
        if (!row) return [];
        const { championship: _championship, ...values } = row;
        return [{ championship, stats: values }];
      }),
    };
  },
);

export type RoundItem = {
  id: string;
  name: string;
  editionId: string;
  maxScore: number;
  public: boolean;
};

/**
 * Esclude i round riservati agli esordienti (OIS 16-17): sono gli unici a non
 * avere task regolari. Un round senza task (edizione appena creata) resta
 * incluso.
 */
export const regularRoundsOnly = sql`(
  not exists (select 1 from task t where t.round_id = ${round.id})
  or exists (select 1 from task t where t.round_id = ${round.id} and t.regular = true)
)`;

/** Round con task ma nessun task regolare: riservati a un campionato. */
export const exclusiveRounds = sql<boolean>`(
  exists (select 1 from task t where t.round_id = ${round.id} and t.regular = false)
  and not exists (select 1 from task t where t.round_id = ${round.id} and t.regular = true)
)`;

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
    .where(
      and(
        eq(round.editionId, editionId ?? "").if(editionId),
        eq(round.public, true),
        regularRoundsOnly,
      ),
    )
    .orderBy(round.startsAt, round.slug);
});

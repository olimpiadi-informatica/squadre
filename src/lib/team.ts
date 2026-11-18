import { cache } from "react";

import { and, eq, gt, isNotNull, isNull, lte, notExists, or, sql } from "drizzle-orm";

import {
  ESORDIENTI,
  finalOnlyRegular,
  membership,
  REGOLARI,
  sortChampionships,
} from "./championship";
import { db } from "./db";
import { penalizedRound, penalizedTeamRound } from "./db/aliases";
import {
  edition,
  institute,
  penalization,
  region,
  round,
  task,
  team,
  teamChampionship,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
  v02b_teamRoundStats,
  v04a_teamStats,
} from "./db/schema";
import type { RoundItem } from "./round";

/** Classifica di una squadra in uno dei campionati a cui partecipa. */
export type TeamStats = {
  championship: string;
  rank: number;
  regionalRank: number;
  totalScores: number;
  avgRoundRank: number;
  bestRoundRank: number;
};

export type Team = {
  name: string;
  coach: string;
  editionId: string;
  editionName: string;
  editionYear: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
  /**
   * I campionati in cui gareggia la squadra (almeno uno), con la relativa
   * classifica: le squadre 'bt-' delle OIS 14/15 ne avevano due.
   */
  championships: TeamStats[];
};

export const getTeam = cache(async (editionId: string, id: string): Promise<Team | undefined> => {
  const [base] = await db
    .select({
      id: team.id,
      name: team.name,
      coach: team.coach,
      editionId: team.editionId,
      editionName: edition.title,
      editionYear: edition.year,
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: region.id,
      regionName: region.name,
    })
    .from(team)
    .innerJoin(edition, eq(edition.id, team.editionId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(region, eq(region.id, institute.region))
    .where(and(eq(team.editionId, editionId), eq(team.slug, id)));
  if (!base) return undefined;

  const [memberships, stats] = await Promise.all([
    db
      .select({ championship: teamChampionship.championship })
      .from(teamChampionship)
      .where(eq(teamChampionship.teamId, base.id)),
    db
      .select({
        championship: v04a_teamStats.championship,
        rank: v04a_teamStats.rankTot,
        regionalRank: v04a_teamStats.rankReg,
        totalScores: v04a_teamStats.totalScores,
        avgRoundRank: v04a_teamStats.avgRoundRank,
        bestRoundRank: v04a_teamStats.bestRoundRank,
      })
      .from(v04a_teamStats)
      .where(eq(v04a_teamStats.teamId, base.id)),
  ]);

  const statsByChampionship = new Map(stats.map((row) => [row.championship, row]));
  // le squadre squalificate dal campionato (rosso) non hanno classifica
  const championships = sortChampionships(memberships.map((row) => row.championship))
    .map((championship) => statsByChampionship.get(championship))
    .filter((row): row is TeamStats => row != null);
  if (championships.length === 0) return undefined;

  const { id: _id, ...rest } = base;
  return { ...rest, championships };
});

export type TeamItem = {
  slug: string;
  name: string;
  coach: string;
  rank: number;
  regionalRank: number;
  totalScores: number;
  editionId: string;
  finalist: boolean | null;
  totalMedals: Record<number, number> | null;
};

export const listTeams = cache((instituteId?: string): Promise<TeamItem[]> => {
  return (
    db
      .select({
        slug: team.slug,
        name: team.name,
        coach: team.coach,
        rank: v04a_teamStats.rankTot,
        regionalRank: v04a_teamStats.rankReg,
        totalScores: v04a_teamStats.totalScores,
        editionId: team.editionId,
        finalist: team.finalist,
        totalMedals: v04a_teamStats.totalMedals,
      })
      .from(team)
      // la pagina dell'istituto mostra i regolari: mai statistiche degli
      // esordienti (le 'bt-' hanno comunque l'appartenenza ai regolari)
      .innerJoin(
        v04a_teamStats,
        and(eq(v04a_teamStats.teamId, team.id), eq(v04a_teamStats.championship, REGOLARI)),
      )
      .where(and(eq(team.instituteId, instituteId ?? "").if(instituteId), eq(team.hidden, false)))
      .orderBy(v04a_teamStats.rankTot, team.name)
  );
});

export type TeamResultItem = {
  slug: string;
  name: string;
  rank: number;
  regionalRank: number;
  finalist: boolean | null;
  totalScores: number;
  editionId: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
};

export const listRoundTeams = cache(
  (
    editionId: string,
    roundSlug: string,
    limit?: number,
    championship: string = REGOLARI,
  ): Promise<TeamResultItem[]> => {
    const teamRoundStats = v02b_teamRoundStats;
    const query = db
      .select({
        slug: team.slug,
        name: team.name,
        rank: teamRoundStats.rankTot,
        regionalRank: teamRoundStats.rankReg,
        finalist: team.finalist,
        totalScores: teamRoundStats.totalScores,
        editionId: team.editionId,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        regionId: region.id,
        regionName: region.name,
      })
      .from(teamRound)
      .innerJoin(
        teamRoundStats,
        and(
          eq(teamRoundStats.teamRoundId, teamRound.id),
          eq(teamRoundStats.championship, championship),
        ),
      )
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(region, eq(region.id, institute.region))
      .where(
        and(
          gt(teamRoundStats.totalScores, 0),
          eq(round.editionId, editionId),
          eq(round.slug, roundSlug),
          eq(team.hidden, false),
        ),
      )
      .orderBy(teamRoundStats.rankTot, institute.region, institute.name, institute.city, team.name);

    return limit ? query.limit(limit) : query;
  },
);

export const listEditionTeams = cache(
  (editionId: string, championship: string = REGOLARI): Promise<TeamResultItem[]> => {
    const teamStats = v04a_teamStats;
    return db
      .select({
        slug: team.slug,
        name: team.name,
        rank: teamStats.rankTot,
        regionalRank: teamStats.rankReg,
        finalist: team.finalist,
        totalScores: teamStats.totalScores,
        editionId: team.editionId,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        regionId: region.id,
        regionName: region.name,
      })
      .from(team)
      .innerJoin(
        teamStats,
        and(eq(teamStats.teamId, team.id), eq(teamStats.championship, championship)),
      )
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(region, eq(region.id, institute.region))
      .where(and(eq(team.editionId, editionId), eq(team.hidden, false)))
      .orderBy(teamStats.rankTot, institute.region, institute.name, institute.city, team.name);
  },
);

/** I campionati presenti in un'edizione, in ordine di tab. */
export const listEditionChampionships = cache((editionId: string): Promise<string[]> => {
  return db
    .selectDistinct({ championship: v04a_teamStats.championship })
    .from(v04a_teamStats)
    .innerJoin(team, and(eq(team.id, v04a_teamStats.teamId), eq(team.hidden, false)))
    .where(eq(team.editionId, editionId))
    .then((rows) => sortChampionships(rows.map((row) => row.championship)));
});

/**
 * Round in cui ha gareggiato un campionato di un'edizione (colonne della tabella
 * delle classifiche).
 *
 * Da OIS 16 i round 1-4 ospitano sia i task regolari sia quelli degli
 * esordienti (prima con i round dedicati '1e'..'4e', poi nello stesso round).
 * Nelle OIS 11-15 il biennio gareggiava sugli stessi task dei regolari. La
 * finale non fa parte dei campionati non-regolari.
 */
export const listChampionshipRounds = cache(
  (editionId: string, championship: string = REGOLARI): Promise<RoundItem[]> => {
    // Il punteggio massimo dipende dai task del campionato: un round può
    // ospitare sia i task regolari sia quelli degli esordienti, che valgono 100
    // punti ciascuno. Se i task non sono ancora caricati vale `fullscore`.
    const taskFlag = championship === ESORDIENTI ? "junior" : "regular";
    return db
      .select({
        id: round.slug,
        name: round.title,
        editionId: round.editionId,
        maxScore: sql<number>`coalesce(nullif(100 * (
          select count(*)::int from task t
          where t.round_id = ${round.id} and t.${sql.raw(taskFlag)} = true
        ), 0), ${round.fullscore})`,
        public: round.public,
      })
      .from(round)
      .innerJoin(teamRound, eq(teamRound.roundId, round.id))
      .innerJoin(teamChampionship, membership(championship, teamRound.teamId))
      .innerJoin(task, eq(task.roundId, round.id))
      .innerJoin(
        teamTaskScore,
        and(eq(teamTaskScore.teamId, teamChampionship.teamId), eq(teamTaskScore.taskId, task.id)),
      )
      .innerJoin(edition, and(eq(round.editionId, edition.id), eq(edition.public, true)))
      .where(
        and(eq(round.editionId, editionId), eq(round.public, true), finalOnlyRegular(championship)),
      )
      .groupBy(round.id, round.slug, round.title, round.fullscore, round.public, round.editionId)
      .orderBy(round.startsAt, round.slug);
  },
);

export type TeamCredential = {
  teamId: number;
  teamRoundId: number;
  slug: string;
  name: string;
  junior: boolean;
  coach: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  instituteEmail: string | null;
  regionId: string;
  password: string;
  delay: number;
  hidden: boolean;
  unrestricted: boolean;
};

export type TeamAdminItem = {
  id: number;
  slug: string;
  name: string;
  instituteName: string;
  instituteCity: string;
  delay: number;
  teamRoundId?: number;
};

export const getTeamAdmin = cache(
  async (
    editionId: string,
    roundSlug: string,
    teamSlug: string,
  ): Promise<TeamAdminItem | undefined> => {
    const [result] = await db
      .select({
        id: team.id,
        slug: team.slug,
        name: team.name,
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
        and(eq(team.editionId, editionId), eq(round.slug, roundSlug), eq(team.slug, teamSlug)),
      );
    return result;
  },
);

export const listRoundTeamsCredentials = (
  editionId: string,
  roundSlug: string,
  junior?: boolean,
  instituteId?: string,
): Promise<TeamCredential[]> => {
  return db
    .select({
      teamId: team.id,
      teamRoundId: teamRound.id,
      slug: team.slug,
      name: team.name,
      // le credenziali distinguevano "debutant"/regular in base al campionato
      junior: sql<boolean>`EXISTS (
        SELECT 1 FROM team_championship tc
        WHERE tc.team_id = ${team.id} AND tc.championship = ${ESORDIENTI}
      )`.as("junior"),
      coach: team.coach,
      hidden: team.hidden,
      unrestricted: team.unrestricted,
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      instituteEmail: institute.email,
      regionId: region.id,
      password: teamRound.password,
      delay: teamRound.delay,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .innerJoin(edition, eq(edition.id, round.editionId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(region, eq(region.id, institute.region))
    .where(
      and(
        eq(edition.id, editionId),
        eq(round.slug, roundSlug),
        // `exists` invece di `membership`: qui `team_championship` non è in join
        // (e aggiungerlo duplicherebbe le 'bt-', iscritte a più campionati)
        junior == null
          ? undefined
          : sql`exists (
              select 1 from team_championship tc
              where tc.team_id = ${team.id}
                and tc.championship = ${junior ? ESORDIENTI : REGOLARI}
            )`,
        eq(team.instituteId, instituteId ?? "").if(instituteId),
        eq(team.finalist, true).if(roundSlug === "final"),
        notExists(
          db
            .select({ id: penalizedTeamRound.id })
            .from(penalizedTeamRound)
            .innerJoin(penalizedRound, eq(penalizedRound.id, penalizedTeamRound.roundId))
            .innerJoin(
              teamRoundPenalization,
              eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
            )
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(penalizedTeamRound.teamId, team.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
                lte(penalizedRound.startsAt, round.startsAt),
              ),
            ),
        ),
      ),
    )
    .orderBy(region.id, institute.name, institute.city, team.name);
};

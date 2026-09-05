import { cache } from "react";

import { and, eq, gt, isNotNull, isNull, lte, notExists, or } from "drizzle-orm";

import { db } from "./db";
import {
  edition,
  institute,
  penalization,
  penalizedRound,
  penalizedTeamRound,
  region,
  round,
  team,
  teamRound,
  teamRoundPenalization,
  v02b_teamRoundStats,
  v04a_teamStats,
} from "./db/schema";

export type Team = {
  name: string;
  coach: string;
  rank: number;
  regionalRank: number;
  editionId: string;
  editionName: string;
  editionYear: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
  totalScores: number;
  avgRoundRank: number;
  bestRoundRank: number;
};

export const getTeam = cache(async (editionId: string, id: string): Promise<Team | undefined> => {
  const [result] = await db
    .select({
      name: team.name,
      coach: team.coach,
      rank: v04a_teamStats.rankTot,
      regionalRank: v04a_teamStats.rankReg,
      editionId: team.editionId,
      editionName: edition.title,
      editionYear: edition.year,
      instituteId: team.instituteId,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: institute.region,
      regionName: region.name,

      totalScores: v04a_teamStats.totalScores,
      avgRoundRank: v04a_teamStats.avgRoundRank,
      bestRoundRank: v04a_teamStats.bestRoundRank,
    })
    .from(team)
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(edition, eq(edition.id, team.editionId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(region, eq(region.id, institute.region))
    .where(and(eq(team.editionId, editionId), eq(team.slug, id)));
  return result;
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
  return db
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
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .where(eq(team.instituteId, instituteId ?? "").if(instituteId))
    .orderBy(v04a_teamStats.rankTot, team.name);
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
  (editionId: string, roundSlug: string, limit?: number): Promise<TeamResultItem[]> => {
    const query = db
      .select({
        slug: team.slug,
        name: team.name,
        rank: v02b_teamRoundStats.rankTot,
        regionalRank: v02b_teamRoundStats.rankReg,
        finalist: team.finalist,
        totalScores: v02b_teamRoundStats.totalScores,
        editionId: team.editionId,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        regionId: region.id,
        regionName: region.name,
      })
      .from(teamRound)
      .innerJoin(v02b_teamRoundStats, eq(v02b_teamRoundStats.teamRoundId, teamRound.id))
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(region, eq(region.id, institute.region))
      .where(
        and(
          gt(v02b_teamRoundStats.totalScores, 0),
          eq(round.editionId, editionId),
          eq(round.slug, roundSlug),
        ),
      )
      .orderBy(
        v02b_teamRoundStats.rankTot,
        institute.region,
        institute.name,
        institute.city,
        team.name,
      );

    return limit ? query.limit(limit) : query;
  },
);

export const listEditionTeams = cache((editionId: string): Promise<TeamResultItem[]> => {
  return db
    .select({
      slug: team.slug,
      name: team.name,
      rank: v04a_teamStats.rankTot,
      regionalRank: v04a_teamStats.rankReg,
      finalist: team.finalist,
      totalScores: v04a_teamStats.totalScores,
      editionId: team.editionId,
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: region.id,
      regionName: region.name,
    })
    .from(team)
    .innerJoin(v04a_teamStats, eq(v04a_teamStats.teamId, team.id))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(region, eq(region.id, institute.region))
    .where(eq(team.editionId, editionId))
    .orderBy(v04a_teamStats.rankTot, institute.region, institute.name, institute.city, team.name);
});

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
};

export type TeamAdminItem = {
  id: number;
  slug: string;
  name: string;
  instituteName: string;
  instituteCity: string;
  delay: number;
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
      junior: team.junior,
      coach: team.coach,
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
        eq(team.junior, junior ?? false).if(junior != null),
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

import { cache } from "react";

import { and, avg, count, eq, gt, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, institute, region, roundScore, team } from "~/lib/db/schema";
import { coalesce, jsonAggregate } from "~/lib/utils";

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
};

export const getTeam = cache(async (editionId: string, id: string): Promise<Team> => {
  const [result] = await db
    .select({
      name: team.name,
      coach: team.coach,
      rank: team.rankTot,
      regionalRank: team.rankReg,
      editionId: team.editionId,
      editionName: edition.title,
      editionYear: edition.year,
      instituteId: team.instId,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: institute.region,
      regionName: region.name,
    })
    .from(team)
    .innerJoin(edition, eq(team.editionId, edition.id))
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(and(eq(team.editionId, editionId), eq(team.id, id)));
  if (!result) throw new Error(`Team ${editionId}-${id} not found`);
  return result;
});

export type TeamStats = {
  totalPoints: number;
  avgRoundRank: number;
  bestRoundRank: number;
};

export const getTeamStats = cache(async (editionId: string, id: string): Promise<TeamStats> => {
  const [result] = await db
    .select({
      totalPoints: coalesce(sum(roundScore.score), 0),
      avgRoundRank: coalesce(avg(roundScore.rankTot), 0),
      bestRoundRank: coalesce(min(roundScore.rankTot), 0),
    })
    .from(roundScore)
    .where(and(eq(roundScore.editionId, editionId), eq(roundScore.teamId, id)));
  return result;
});

export type TeamItem = {
  id: string;
  name: string;
  coach: string;
  rank: number;
  regionalRank: number;
  points: number;
  editionId: string;
  finalist: boolean;
  totalMedals: Record<number, number>;
};

const medalCte = db.$with("medals").as(
  db
    .select({
      teamId: roundScore.teamId,
      editionId: roundScore.editionId,
      medal: roundScore.medal,
      count: count().as("count"),
    })
    .from(roundScore)
    .where(and(isNotNull(roundScore.medal)))
    .groupBy(roundScore.teamId, roundScore.editionId, roundScore.medal),
);

export const listTeams = cache((instituteId?: string): Promise<TeamItem[]> => {
  return db
    .with(medalCte)
    .select({
      id: team.id,
      name: team.name,
      coach: team.coach,
      rank: team.rankTot,
      regionalRank: team.rankReg,
      points: team.points,
      editionId: team.editionId,
      finalist: sql`${team.finalist}`.mapWith(Boolean),
      totalMedals: sql`${db
        .select({
          medals: jsonAggregate(medalCte.medal, medalCte.count),
        })
        .from(medalCte)
        .where(and(eq(medalCte.teamId, team.id), eq(medalCte.editionId, team.editionId)))}`.mapWith(
        JSON.parse,
      ),
    })
    .from(team)
    .where(eq(team.instId, instituteId ?? "").if(instituteId))
    .orderBy(team.rankTot);
});

export type TeamResultItem = {
  id: string;
  name: string;
  rank: number;
  regionalRank: number;
  finalist: boolean;
  points: number;
  editionId: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
};

export const listRoundTeams = cache(
  (editionId: string, roundId: string, limit?: number): Promise<TeamResultItem[]> => {
    const query = db
      .select({
        id: team.id,
        name: team.name,
        rank: roundScore.rankTot,
        regionalRank: roundScore.rankReg,
        finalist: sql`${team.finalist}`.mapWith(Boolean),
        points: roundScore.score,
        editionId: team.editionId,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        regionId: region.id,
        regionName: region.name,
      })
      .from(roundScore)
      .innerJoin(
        team,
        and(eq(roundScore.editionId, team.editionId), eq(roundScore.teamId, team.id)),
      )
      .innerJoin(institute, eq(team.instId, institute.id))
      .innerJoin(region, eq(institute.region, region.id))
      .where(
        and(
          eq(roundScore.editionId, editionId),
          eq(roundScore.roundId, roundId),
          gt(roundScore.score, 0),
        ),
      )
      .orderBy(roundScore.rankTot, institute.region, institute.name, institute.city, team.name);

    return limit ? query.limit(limit) : query;
  },
);

export const listEditionTeams = cache((editionId: string): Promise<TeamResultItem[]> => {
  return db
    .select({
      id: team.id,
      name: team.name,
      rank: team.rankTot,
      regionalRank: team.rankReg,
      finalist: sql`${team.finalist}`.mapWith(Boolean),
      points: team.points,
      editionId: team.editionId,
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: region.id,
      regionName: region.name,
    })
    .from(team)
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(and(eq(team.editionId, editionId)))
    .orderBy(roundScore.rankTot, institute.region, institute.name, institute.city, team.name);
});

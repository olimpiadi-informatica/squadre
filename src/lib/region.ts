import { cache } from "react";

import { and, count, countDistinct, eq, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { institute, region, roundScore, team } from "~/lib/db/schema";
import { coalesce, concat, jsonAggregate } from "~/lib/utils";

export type Region = {
  id: string;
  name: string;
};

export const getRegion = cache(async (regionId: string): Promise<Region> => {
  const [result] = await db
    .select({
      id: region.id,
      name: region.name,
    })
    .from(region)
    .where(eq(region.id, regionId));
  if (!result) throw new Error(`Region ${regionId} not found`);
  return result;
});

export type RegionStats = {
  totalEditions: number;
  totalInstitutes: number;
  totalTeams: number;
  totalPoints: number;
  bestEditionRank: number;
  bestRoundRank: number;
};

export const getRegionStats = cache(async (regionId?: string): Promise<RegionStats> => {
  const [result] = await db
    .select({
      totalInstitutes: countDistinct(team.instId),
      totalEditions: countDistinct(team.editionId),
      totalTeams: countDistinct(concat(team.editionId, "-", team.id)),
      totalPoints: coalesce(sum(roundScore.score), 0),
      bestEditionRank: coalesce(min(team.rankTot), 0),
      bestRoundRank: coalesce(min(roundScore.rankTot), 0),
    })
    .from(team)
    .innerJoin(
      roundScore,
      and(eq(team.editionId, roundScore.editionId), eq(team.id, roundScore.teamId)),
    )
    .innerJoin(institute, eq(team.instId, institute.id))
    .where(eq(institute.region, regionId ?? "").if(regionId));
  return result;
});

export type RegionItem = {
  id: string;
  name: string;
  totalInstitutes: number;
  totalTeams: number;
  totalPoints: number;
  totalMedals: Record<number, number>;
};

const medalCte = db.$with("medals").as(
  db
    .select({
      regionId: institute.region,
      medal: roundScore.medal,
      count: count().as("count"),
    })
    .from(roundScore)
    .innerJoin(team, and(eq(roundScore.teamId, team.id), eq(roundScore.editionId, team.editionId)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .where(and(isNotNull(roundScore.medal)))
    .groupBy(institute.region, roundScore.medal),
);

export const listRegions = cache((): Promise<RegionItem[]> => {
  return db
    .with(medalCte)
    .select({
      id: region.id,
      name: region.name,
      totalInstitutes: countDistinct(team.instId),
      totalTeams: countDistinct(concat(team.editionId, "-", team.id)),
      totalPoints: coalesce(sum(team.points), 0),
      totalMedals: sql`${db
        .select({
          medals: jsonAggregate(medalCte.medal, medalCte.count),
        })
        .from(medalCte)
        .where(eq(medalCte.regionId, region.id))}`.mapWith(JSON.parse),
    })
    .from(region)
    .innerJoin(institute, eq(region.id, institute.region))
    .innerJoin(team, eq(team.instId, institute.id))
    .groupBy(region.id);
});

import { cache } from "react";

import { and, count, countDistinct, eq, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, institute, region, round, team, teamRound } from "~/lib/db/schema";
import { coalesce, concat, jsonAggregate } from "~/lib/utils";

export type Region = {
  id: string;
  name: string;
};

export const getRegion = cache(async (regionId: string): Promise<Region | undefined> => {
  const [result] = await db
    .select({
      id: region.id,
      name: region.name,
    })
    .from(region)
    .where(eq(region.id, regionId));
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
      totalPoints: coalesce(sum(teamRound.score), 0),
      bestEditionRank: coalesce(min(team.rankTot), 0),
      bestRoundRank: coalesce(min(teamRound.rankTot), 0),
    })
    .from(team)
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
    .innerJoin(
      teamRound,
      and(eq(team.editionId, teamRound.editionId), eq(team.id, teamRound.teamId)),
    )
    .innerJoin(
      round,
      and(
        eq(teamRound.roundId, round.id),
        eq(teamRound.editionId, round.editionId),
        eq(round.public, 1),
      ),
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
      medal: teamRound.medal,
      count: count().as("count"),
    })
    .from(teamRound)
    .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
    .innerJoin(
      round,
      and(
        eq(teamRound.roundId, round.id),
        eq(teamRound.editionId, round.editionId),
        eq(round.public, 1),
      ),
    )
    .innerJoin(institute, eq(team.instId, institute.id))
    .where(and(isNotNull(teamRound.medal)))
    .groupBy(institute.region, teamRound.medal),
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
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
    .groupBy(region.id);
});

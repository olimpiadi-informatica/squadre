import { cache } from "react";

import { eq } from "drizzle-orm";

import { db } from "./db";
import { region, v08a_regionStats } from "./db/schema";

export type Region = {
  id: string;
  name: string;
  totalEditions: number;
  totalInstitutes: number;
  totalTeams: number;
  totalScores: number;
  bestEditionRank: number;
  bestRoundRank: number;
};

export const getRegion = cache(async (regionId: string): Promise<Region | undefined> => {
  const [result] = await db
    .select({
      id: region.id,
      name: region.name,
      totalEditions: v08a_regionStats.totalEditions,
      totalInstitutes: v08a_regionStats.totalInstitutes,
      totalTeams: v08a_regionStats.totalTeams,
      totalScores: v08a_regionStats.totalScores,
      bestEditionRank: v08a_regionStats.bestEditionRank,
      bestRoundRank: v08a_regionStats.bestRoundRank,
    })
    .from(region)
    .innerJoin(v08a_regionStats, eq(v08a_regionStats.regionId, region.id))
    .where(eq(region.id, regionId));
  return result;
});

export type RegionItem = {
  id: string;
  name: string;
  totalInstitutes: number;
  totalTeams: number;
  totalScores: number;
  totalMedals: Record<number, number> | null;
};

export const listRegions = cache((): Promise<RegionItem[]> => {
  return db
    .select({
      id: region.id,
      name: region.name,
      totalEditions: v08a_regionStats.totalEditions,
      totalInstitutes: v08a_regionStats.totalInstitutes,
      totalTeams: v08a_regionStats.totalTeams,
      totalScores: v08a_regionStats.totalScores,
      totalMedals: v08a_regionStats.totalMedals,
    })
    .from(region)
    .innerJoin(v08a_regionStats, eq(v08a_regionStats.regionId, region.id));
});

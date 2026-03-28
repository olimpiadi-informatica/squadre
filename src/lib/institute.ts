import { cache } from "react";

import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { institute, region, v07a_instituteStats } from "./db/schema";

export type Institute = {
  id: string;
  name: string;
  city: string;
  regionId: string;
  regionName: string;
  totalEditions: number;
  totalTeams: number;
  totalScores: number;
  totalMedals: Record<number, number> | null;

  bestEditionRank: number;
  bestRoundRank: number;
};

export const listInstitutes = cache(
  (regionId?: string, instituteId?: string): Promise<Institute[]> => {
    return db
      .select({
        id: institute.id,
        name: institute.name,
        city: institute.city,
        regionId: institute.region,
        regionName: region.name,
        totalEditions: v07a_instituteStats.totalEditions,
        totalTeams: v07a_instituteStats.totalTeams,
        totalScores: v07a_instituteStats.totalScores,
        totalMedals: v07a_instituteStats.totalMedals,
        bestEditionRank: v07a_instituteStats.bestEditionRank,
        bestRoundRank: v07a_instituteStats.bestRoundRank,
      })
      .from(institute)
      .innerJoin(v07a_instituteStats, eq(v07a_instituteStats.instituteId, institute.id))
      .innerJoin(region, eq(region.id, institute.region))
      .where(
        and(
          eq(institute.region, regionId ?? "").if(regionId),
          eq(institute.id, instituteId ?? "").if(instituteId),
        ),
      )
      .orderBy(institute.city, institute.name);
  },
);

export async function getInstitute(id: string): Promise<Institute | undefined> {
  const [result] = await listInstitutes(undefined, id);
  return result;
}

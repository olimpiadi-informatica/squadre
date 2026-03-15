import { cache } from "react";

import { and, count, countDistinct, eq, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, institute, region, round, roundScore, team } from "~/lib/db/schema";
import { coalesce, concat, jsonAggregate } from "~/lib/utils";

export type Institute = {
  id: string;
  name: string;
  city: string;
  regionId: string;
  regionName: string;
  totalEditions: number;
  totalTeams: number;
  totalPoints: number;
  totalMedals: Record<number, number>;
};

const medalCte = db.$with("medals").as(
  db
    .select({
      instituteId: team.instId,
      medal: roundScore.medal,
      count: count().as("count"),
    })
    .from(roundScore)
    .innerJoin(team, and(eq(roundScore.teamId, team.id), eq(roundScore.editionId, team.editionId)))
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
    .innerJoin(
      round,
      and(
        eq(roundScore.roundId, round.id),
        eq(roundScore.editionId, round.editionId),
        eq(round.public, 1),
      ),
    )
    .where(and(isNotNull(roundScore.medal)))
    .groupBy(team.instId, roundScore.medal),
);

export const listInstitutes = cache(
  (regionId?: string, instituteId?: string): Promise<Institute[]> => {
    return db
      .with(medalCte)
      .select({
        id: institute.id,
        name: institute.name,
        city: institute.city,
        regionId: institute.region,
        regionName: region.name,
        totalEditions: countDistinct(team.editionId),
        totalTeams: countDistinct(concat(team.editionId, "-", team.id)),
        totalPoints: coalesce(sum(team.points), 0),
        totalMedals: sql`${db
          .select({
            medals: jsonAggregate(medalCte.medal, medalCte.count),
          })
          .from(medalCte)
          .where(eq(institute.id, medalCte.instituteId))}`.mapWith(JSON.parse),
      })
      .from(institute)
      .innerJoin(team, eq(team.instId, institute.id))
      .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
      .innerJoin(region, eq(region.id, institute.region))
      .where(
        and(
          eq(institute.region, regionId ?? "").if(regionId),
          eq(institute.id, instituteId ?? "").if(instituteId),
        ),
      )
      .groupBy(institute.id)
      .orderBy(institute.city, institute.name);
  },
);

export async function getInstitute(id: string): Promise<Institute | undefined> {
  const [result] = await listInstitutes(undefined, id);
  return result;
}

export type InstituteStats = {
  bestEditionRank: number;
  bestRoundRank: number;
};

export const getInstituteStats = cache(async (id: string): Promise<InstituteStats> => {
  const [result] = await db
    .select({
      bestEditionRank: coalesce(min(team.rankTot), 0),
      bestRoundRank: coalesce(min(roundScore.rankTot), 0),
    })
    .from(team)
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
    .innerJoin(
      roundScore,
      and(eq(team.editionId, roundScore.editionId), eq(team.id, roundScore.teamId)),
    )
    .innerJoin(
      round,
      and(
        eq(roundScore.roundId, round.id),
        eq(roundScore.editionId, round.editionId),
        eq(round.public, 1),
      ),
    )
    .where(eq(team.instId, id));
  return result;
});

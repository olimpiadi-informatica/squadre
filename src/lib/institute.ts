import { cache } from "react";

import { and, count, countDistinct, eq, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, institute, region, round, team, teamRound } from "~/lib/db/schema";
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
    .where(and(isNotNull(teamRound.medal)))
    .groupBy(team.instId, teamRound.medal),
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
    .where(eq(team.instId, id));
  return result;
});

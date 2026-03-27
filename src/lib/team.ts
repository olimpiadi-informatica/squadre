import { cache } from "react";

import { and, avg, count, eq, gt, isNotNull, min, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, institute, region, round, team, teamRound } from "~/lib/db/schema";
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

export const getTeam = cache(async (editionId: string, id: string): Promise<Team | undefined> => {
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
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, true)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(and(eq(team.editionId, editionId), eq(team.id, id), eq(team.junior, false)));
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
      totalPoints: coalesce(sum(teamRound.score), 0),
      avgRoundRank: coalesce(avg(teamRound.rankTot), 0),
      bestRoundRank: coalesce(min(teamRound.rankTot), 0),
    })
    .from(teamRound)
    .innerJoin(edition, and(eq(teamRound.editionId, edition.id), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(teamRound.roundId, round.id),
        eq(teamRound.editionId, round.editionId),
        eq(round.public, true),
      ),
    )
    .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
    .where(
      and(eq(teamRound.editionId, editionId), eq(teamRound.teamId, id), eq(team.junior, false)),
    );
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
  totalMedals: Record<number, number> | null;
};

const medalCte = db.$with("medals").as(
  db
    .select({
      teamId: teamRound.teamId,
      editionId: teamRound.editionId,
      medal: teamRound.medal,
      count: count().as("count"),
    })
    .from(teamRound)
    .innerJoin(edition, and(eq(teamRound.editionId, edition.id), eq(edition.public, true)))
    .innerJoin(
      round,
      and(
        eq(teamRound.roundId, round.id),
        eq(teamRound.editionId, round.editionId),
        eq(round.public, true),
      ),
    )
    .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
    .where(and(isNotNull(teamRound.medal), eq(team.junior, false)))
    .groupBy(teamRound.teamId, teamRound.editionId, teamRound.medal),
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
      totalMedals: sql<Record<number, number> | null>`${db
        .select({
          medals: jsonAggregate(medalCte.medal, medalCte.count),
        })
        .from(medalCte)
        .where(and(eq(medalCte.teamId, team.id), eq(medalCte.editionId, team.editionId)))}`,
    })
    .from(team)
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, true)))
    .where(and(eq(team.instId, instituteId ?? "").if(instituteId), eq(team.junior, false)))
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
        rank: teamRound.rankTot,
        regionalRank: teamRound.rankReg,
        finalist: sql`${team.finalist}`.mapWith(Boolean),
        points: teamRound.score,
        editionId: team.editionId,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        regionId: region.id,
        regionName: region.name,
      })
      .from(teamRound)
      .innerJoin(edition, and(eq(teamRound.editionId, edition.id), eq(edition.public, true)))
      .innerJoin(
        round,
        and(
          eq(teamRound.roundId, round.id),
          eq(teamRound.editionId, round.editionId),
          eq(round.public, true),
        ),
      )
      .innerJoin(team, and(eq(teamRound.editionId, team.editionId), eq(teamRound.teamId, team.id)))
      .innerJoin(institute, eq(team.instId, institute.id))
      .innerJoin(region, eq(institute.region, region.id))
      .where(
        and(
          eq(teamRound.editionId, editionId),
          eq(teamRound.roundId, roundId),
          gt(teamRound.score, 0),
          eq(team.junior, false),
        ),
      )
      .orderBy(teamRound.rankTot, institute.region, institute.name, institute.city, team.name);

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
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, true)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(and(eq(team.editionId, editionId), eq(team.junior, false)))
    .orderBy(team.rankTot, institute.region, institute.name, institute.city, team.name);
});

export type TeamCredential = {
  teamId: string;
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

export const listRoundTeamsCredentials = (
  editionId: string,
  roundId: string,
  junior?: boolean,
  instituteId?: string,
): Promise<TeamCredential[]> => {
  return db
    .select({
      teamId: team.id,
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
    .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(
      and(
        eq(teamRound.editionId, editionId),
        eq(teamRound.roundId, roundId),
        eq(team.junior, junior ?? false).if(junior != null),
        eq(team.instId, instituteId ?? "").if(instituteId),
        eq(team.finalist, true).if(roundId === "final"),
      ),
    )
    .orderBy(region.id, institute.name, institute.city, team.name);
};

import { and, count, countDistinct, eq, exists, gt, sql } from "drizzle-orm";

import { db } from "./db";
import { institute, internetCheck, round, task, team, teamRound, teamTaskScore } from "./db/schema";

export type TeamInternetCheck = {
  ts: Date;
  serverTs: Date;
  ic: boolean[];
  pcHash: string;
};

export function getTeamInternetChecks(
  roundId: number,
  teamId: number,
): Promise<TeamInternetCheck[]> {
  return db
    .select({
      ts: internetCheck.ts,
      serverTs: internetCheck.serverTs,
      ic: internetCheck.ic,
      pcHash: internetCheck.pcHash,
    })
    .from(internetCheck)
    .where(and(eq(internetCheck.roundId, roundId), eq(internetCheck.teamId, teamId)))
    .orderBy(internetCheck.serverTs);
}

export type TeamRoundInternetCheck = {
  teamSlug: string;
  teamName: string;
  instituteName: string;
  instituteCity: string;
  editionId: string;
  roundSlug: string;
  numPc: number;
  numChecks: number;
  numSuccessChecks: number;
};

export function getTeamRoundInternetChecks(
  editionId: string,
  roundSlug: string,
): Promise<TeamRoundInternetCheck[]> {
  return db
    .select({
      teamSlug: team.slug,
      teamName: team.name,
      instituteName: institute.name,
      instituteCity: institute.city,
      editionId: round.editionId,
      roundSlug: round.slug,
      numPc: countDistinct(internetCheck.pcHash),
      numChecks: count(internetCheck.id),
      numSuccessChecks: sql<number>`COUNT(*) FILTER (WHERE NOT (FALSE = ANY(${internetCheck.ic})))`,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .leftJoin(
      internetCheck,
      and(eq(internetCheck.teamId, teamRound.teamId), eq(internetCheck.roundId, teamRound.roundId)),
    )
    .where(
      and(
        eq(round.editionId, editionId),
        eq(round.slug, roundSlug),
        exists(
          db
            .select()
            .from(teamTaskScore)
            .innerJoin(task, eq(task.id, teamTaskScore.taskId))
            .where(
              and(
                eq(teamTaskScore.teamId, teamRound.teamId),
                eq(task.roundId, teamRound.roundId),
                gt(teamTaskScore.score, 0),
              ),
            ),
        ),
      ),
    )
    .groupBy(team.slug, team.name, institute.name, institute.city, round.editionId, round.slug)
    .orderBy(institute.name, institute.city, team.name);
}

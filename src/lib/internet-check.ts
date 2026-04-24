import { and, countDistinct, eq, exists, gt, inArray, ne, sql } from "drizzle-orm";

import { db } from "./db";
import {
  type InternetCheckStatus,
  institute,
  internetCheck,
  round,
  task,
  team,
  teamRound,
  teamTaskScore,
} from "./db/schema";

export type TeamInternetSegment = {
  startTs: Date;
  endTs: Date;
  status: InternetCheckStatus;
  pcHash: string;
  userAgent: string | null;
  browserName: string | null;
  browserMajor: number | null;
  osName: string | null;
};

export function getTeamInternetChecks(
  roundId: number,
  teamId: number,
): Promise<TeamInternetSegment[]> {
  return db
    .select({
      startTs: internetCheck.startTs,
      endTs: internetCheck.endTs,
      status: internetCheck.status,
      pcHash: internetCheck.pcHash,
      userAgent: internetCheck.userAgent,
      browserName: internetCheck.browserName,
      browserMajor: internetCheck.browserMajor,
      osName: internetCheck.osName,
    })
    .from(internetCheck)
    .innerJoin(teamRound, eq(teamRound.id, internetCheck.teamRoundId))
    .where(and(eq(teamRound.teamId, teamId), eq(teamRound.roundId, roundId)))
    .orderBy(internetCheck.pcHash, internetCheck.startTs);
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
  numSucceededChecks: number;
  numFailedChecks: number;
  numMissingChecks: number;
  hasIssues: boolean;
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
      numChecks: sql<number>`COUNT(*) FILTER (WHERE ${ne(internetCheck.status, "empty")})`,
      numSucceededChecks: sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "succeeded")})`,
      numFailedChecks: sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "failed")})`,
      numMissingChecks: sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "missing")})`,
      hasIssues: sql<boolean>`
        COUNT(*) FILTER (WHERE ${inArray(internetCheck.status, ["failed", "missing"])}) > 0
        OR COUNT(DISTINCT ${internetCheck.pcHash}) > 2
      `,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .leftJoin(internetCheck, eq(internetCheck.teamRoundId, teamRound.id))
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

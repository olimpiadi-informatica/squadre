import { and, countDistinct, eq, exists, gt, ne, sql } from "drizzle-orm";

import { db } from "./db";
import {
  type InternetCheckStatus,
  institute,
  internetCheck,
  proctoringUnavailable,
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

export async function getTeamRoundInternetChecks(
  editionId: string,
  roundSlug: string,
): Promise<TeamRoundInternetCheck[]> {
  /**
   * Finestre in cui il proctoring non stava raccogliendo: le righe che ci
   * cadono dentro non sono buchi della squadra e non vanno conteggiate.
   *
   * Le finestre sono poche, quindi le trasformiamo in condizioni letterali
   * invece di un `EXISTS` correlato: su centinaia di migliaia di righe la
   * differenza è di quasi un ordine di grandezza.
   */
  const unavailableWindows = await db
    .select({
      teamId: proctoringUnavailable.teamId,
      startTs: proctoringUnavailable.startTs,
      endTs: proctoringUnavailable.endTs,
    })
    .from(proctoringUnavailable)
    .innerJoin(round, eq(round.id, proctoringUnavailable.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));

  const notUnavailable =
    unavailableWindows.length === 0
      ? sql`true`
      : sql`NOT (${sql.join(
          unavailableWindows.map((window) => {
            const overlap = sql`${internetCheck.startTs} < ${window.endTs} AND ${internetCheck.endTs} > ${window.startTs}`;
            return window.teamId == null
              ? sql`(${overlap})`
              : sql`(${overlap} AND ${teamRound.teamId} = ${window.teamId})`;
          }),
          sql` OR `,
        )})`;

  /**
   * I controlli sono aggregati per `team_round` in una sottoquery: aggregare
   * direttamente sulla join (con `count(distinct pc_hash)`) costringe Postgres a
   * ordinare tutti i controlli su disco, mentre così può usare l'indice
   * `internet_check_team_round_id_pc_hash_status_idx` con un index-only scan.
   */
  const checks = db
    .select({
      teamRoundId: internetCheck.teamRoundId,
      numPc: countDistinct(internetCheck.pcHash).as("num_pc"),
      numChecks:
        sql<number>`COUNT(*) FILTER (WHERE ${ne(internetCheck.status, "empty")} AND ${notUnavailable})`.as(
          "num_checks",
        ),
      numSucceededChecks:
        sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "succeeded")} AND ${notUnavailable})`.as(
          "num_succeeded_checks",
        ),
      numFailedChecks:
        sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "failed")} AND ${notUnavailable})`.as(
          "num_failed_checks",
        ),
      numMissingChecks:
        sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "missing")} AND ${notUnavailable})`.as(
          "num_missing_checks",
        ),
    })
    .from(internetCheck)
    .innerJoin(teamRound, eq(teamRound.id, internetCheck.teamRoundId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .groupBy(internetCheck.teamRoundId)
    .as("checks");

  return db
    .select({
      teamSlug: team.slug,
      teamName: team.name,
      instituteName: institute.name,
      instituteCity: institute.city,
      editionId: round.editionId,
      roundSlug: round.slug,
      numPc: sql<number>`COALESCE(${checks.numPc}, 0)::int`,
      numChecks: sql<number>`COALESCE(${checks.numChecks}, 0)::int`,
      numSucceededChecks: sql<number>`COALESCE(${checks.numSucceededChecks}, 0)::int`,
      numFailedChecks: sql<number>`COALESCE(${checks.numFailedChecks}, 0)::int`,
      numMissingChecks: sql<number>`COALESCE(${checks.numMissingChecks}, 0)::int`,
      hasIssues: sql<boolean>`
        COALESCE(${checks.numFailedChecks}, 0) + COALESCE(${checks.numMissingChecks}, 0) > 0
        OR COALESCE(${checks.numPc}, 0) > 2
      `,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .leftJoin(checks, eq(checks.teamRoundId, teamRound.id))
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
    .orderBy(institute.name, institute.city, team.name);
}

import { cache } from "react";

import { and, desc, eq, gt, isNotNull, isNull, notExists, or } from "drizzle-orm";

import { db } from "./db";
import { penalizedTeamRound } from "./db/aliases";
import {
  edition,
  institute,
  penalization,
  region,
  round,
  task,
  team,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
  v01a_teamTaskScoreStats,
  v02b_teamRoundStats,
} from "./db/schema";

export type ScoreItem = {
  score: number;
  teamSlug: string;
  taskSlug: string;
  taskTitle: string;
  roundSlug: string;
};

export const listScores = cache(
  (editionId: string, roundSlug?: string, teamSlug?: string): Promise<ScoreItem[]> => {
    return db
      .select({
        score: teamTaskScore.score,
        teamSlug: team.slug,
        taskSlug: task.slug,
        taskTitle: task.title,
        roundSlug: round.slug,
      })
      .from(teamTaskScore)
      .innerJoin(team, eq(team.id, teamTaskScore.teamId))
      .innerJoin(task, eq(task.id, teamTaskScore.taskId))
      .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
      .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
      .where(
        and(
          eq(edition.id, editionId ?? "").if(editionId),
          eq(round.slug, roundSlug ?? "").if(roundSlug),
          eq(team.slug, teamSlug ?? "").if(teamSlug),
          eq(team.junior, false),
          eq(team.hidden, false),
          notExists(
            db
              .select({ id: penalizedTeamRound.id })
              .from(penalizedTeamRound)
              .innerJoin(
                teamRoundPenalization,
                eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
              )
              .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
              .where(
                and(
                  eq(penalizedTeamRound.teamId, team.id),
                  eq(penalization.level, "red"),
                  isNotNull(penalization.sentAt),
                  or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
                ),
              ),
          ),
        ),
      )
      .orderBy(task.slug);
  },
);

export type TaskScoreItem = {
  teamSlug: string;
  teamName: string;
  score: number;
  rank: number;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
};

export const listTaskScores = cache((taskSlug?: string): Promise<TaskScoreItem[]> => {
  return db
    .select({
      teamSlug: team.slug,
      teamName: team.name,
      score: teamTaskScore.score,
      rank: v01a_teamTaskScoreStats.rankTot,
      instituteId: team.instituteId,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: institute.region,
      regionName: region.name,
    })
    .from(teamTaskScore)
    .innerJoin(
      v01a_teamTaskScoreStats,
      eq(v01a_teamTaskScoreStats.teamTaskScoreId, teamTaskScore.id),
    )
    .innerJoin(team, eq(team.id, teamTaskScore.teamId))
    .innerJoin(task, eq(task.id, teamTaskScore.taskId))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .innerJoin(institute, eq(team.instituteId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(
      and(
        eq(task.slug, taskSlug ?? "").if(taskSlug),
        gt(teamTaskScore.score, 0),
        eq(team.junior, false),
        eq(team.hidden, false),
      ),
    )
    .orderBy(desc(teamTaskScore.score));
});

export type RoundScoreItem = {
  rank: number;
  regionalRank: number;
  totalScores: number;
  medal: number | null;
  teamSlug: string;
  roundSlug: string;
  roundName: string;
  editionId: string;
};

export const listRoundScores = cache(
  (editionId: string, teamSlug?: string): Promise<RoundScoreItem[]> => {
    return db
      .select({
        rank: v02b_teamRoundStats.rankTot,
        regionalRank: v02b_teamRoundStats.rankReg,
        totalScores: v02b_teamRoundStats.totalScores,
        medal: v02b_teamRoundStats.medal,
        teamSlug: team.slug,
        roundSlug: round.slug,
        roundName: round.title,
        editionId: edition.id,
      })
      .from(team)
      .innerJoin(teamRound, eq(teamRound.teamId, team.id))
      .innerJoin(v02b_teamRoundStats, eq(v02b_teamRoundStats.teamRoundId, teamRound.id))
      .innerJoin(round, and(eq(round.id, teamRound.roundId), eq(round.public, true)))
      .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
      .where(
        and(
          eq(edition.id, editionId),
          eq(team.slug, teamSlug ?? "").if(teamSlug),
          eq(team.junior, false),
          eq(team.hidden, false),
        ),
      )
      .orderBy(round.startsAt, round.slug);
  },
);

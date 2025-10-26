import { cache } from "react";

import { and, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "~/lib/db";
import { institute, region, round, roundScore, task, taskScore, team } from "~/lib/db/schema";

export type ScoreItem = {
  score: number;
  teamId: string;
  taskName: string;
  taskTitle: string;
  roundId: string;
};

export const listScores = cache(
  (editionId: string, roundId?: string, teamId?: string): Promise<ScoreItem[]> => {
    return db
      .select({
        score: taskScore.score,
        teamId: taskScore.teamId,
        taskName: taskScore.taskName,
        taskTitle: task.title,
        roundId: task.roundId,
      })
      .from(taskScore)
      .innerJoin(task, eq(taskScore.taskName, task.name))
      .where(
        and(
          eq(task.editionId, editionId ?? "").if(editionId),
          eq(task.roundId, roundId ?? "").if(roundId),
          eq(taskScore.teamId, teamId ?? "").if(teamId),
        ),
      )
      .orderBy(task.name);
  },
);

export type TaskScoreItem = {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  taskName: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  regionId: string;
  regionName: string;
};

export const listTaskScores = cache((taskName?: string): Promise<TaskScoreItem[]> => {
  return db
    .select({
      teamId: taskScore.teamId,
      teamName: team.name,
      score: taskScore.score,
      rank: sql<number>`RANK() OVER (ORDER BY ${taskScore.score} DESC)`,
      taskName: taskScore.taskName,
      instituteId: team.instId,
      instituteName: institute.name,
      instituteCity: institute.city,
      regionId: institute.region,
      regionName: region.name,
    })
    .from(taskScore)
    .innerJoin(team, and(eq(taskScore.editionId, team.editionId), eq(taskScore.teamId, team.id)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .innerJoin(region, eq(institute.region, region.id))
    .where(and(eq(taskScore.taskName, taskName ?? "").if(taskName), gt(taskScore.score, 0)))
    .orderBy(desc(taskScore.score));
});

export type RoundScoreItem = {
  rank: number;
  regionalRank: number;
  totalPoints: number;
  medal: number | null;
  teamId: string;
  roundId: string;
  roundName: string;
  editionId: string;
};

export const listRoundScores = cache(
  (editionId: string, teamId?: string): Promise<RoundScoreItem[]> => {
    return db
      .select({
        rank: roundScore.rankTot,
        regionalRank: roundScore.rankReg,
        totalPoints: roundScore.score,
        medal: roundScore.medal,
        teamId: roundScore.teamId,
        roundId: roundScore.roundId,
        roundName: round.title,
        editionId: roundScore.editionId,
      })
      .from(roundScore)
      .innerJoin(
        round,
        and(eq(roundScore.editionId, round.editionId), eq(roundScore.roundId, round.id)),
      )
      .where(
        and(eq(roundScore.editionId, editionId), eq(roundScore.teamId, teamId ?? "").if(teamId)),
      );
  },
);

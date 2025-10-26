import { cache } from "react";

import { and, avg, count, eq, gt, max, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, round, task, taskScore } from "~/lib/db/schema";
import { coalesce, median } from "~/lib/utils";

export type Task = {
  name: string;
  title: string;
  editionId: string;
  editionName: string;
  roundId: string;
  roundName: string;
  statement: string;
};

export const getTask = cache(async (name: string): Promise<Task> => {
  const [result] = await db
    .select({
      name: task.name,
      title: task.title,
      editionId: task.editionId,
      editionName: edition.title,
      roundId: task.roundId,
      roundName: round.title,
      statement: task.statement,
    })
    .from(task)
    .innerJoin(edition, eq(task.editionId, edition.id))
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.editionId, edition.id)))
    .where(eq(task.name, name));
  if (!result) throw new Error(`Task ${name} not found`);
  return result;
});

export type TaskStats = {
  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export const getTaskStats = cache(async (name: string): Promise<TaskStats> => {
  const [result] = await db
    .select({
      teamScored: count(),
      totalScores: coalesce(sum(taskScore.score), 0),
      maxScore: coalesce(max(taskScore.score), 0),
      avgScore: coalesce(avg(taskScore.score), 0),
      medianScore: coalesce(median(taskScore.score), 0),
    })
    .from(taskScore)
    .where(and(eq(taskScore.taskName, name), gt(taskScore.score, 0)));
  return result;
});

export type TaskItem = {
  name: string;
  editionId: string;
  roundId: string;
};

export const listTasks = cache((editionId?: string, roundId?: string): Promise<TaskItem[]> => {
  return db
    .select({
      name: task.name,
      editionId: task.editionId,
      roundId: task.roundId,
    })
    .from(task)
    .where(
      and(
        eq(task.editionId, editionId ?? "").if(editionId),
        eq(task.roundId, roundId ?? "").if(roundId),
      ),
    );
});

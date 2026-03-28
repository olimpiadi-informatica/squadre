import { cache } from "react";

import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { edition, round, task, v00a_taskStats } from "./db/schema";

export type Task = {
  slug: string;
  title: string;
  editionId: string;
  editionName: string;
  roundSlug: string;
  roundName: string;
  statement: string;
  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export const getTask = cache(async (taskSlug: string): Promise<Task | undefined> => {
  const [result] = await db
    .select({
      slug: task.slug,
      title: task.title,
      editionId: edition.id,
      editionName: edition.title,
      roundSlug: round.slug,
      roundName: round.title,
      statement: task.statement,
      teamScored: v00a_taskStats.teamScored,
      totalScores: v00a_taskStats.totalScores,
      maxScore: v00a_taskStats.maxScore,
      avgScore: v00a_taskStats.avgScore,
      medianScore: v00a_taskStats.medianScore,
    })
    .from(task)
    .innerJoin(v00a_taskStats, eq(v00a_taskStats.taskId, task.id))
    .innerJoin(round, eq(round.id, task.roundId))
    .innerJoin(edition, eq(edition.id, round.editionId))
    .where(eq(task.slug, taskSlug));
  return result;
});

export type TaskItem = {
  slug: string;
  editionId: string;
  roundSlug: string;
};

export const listTasks = cache((editionId?: string, roundSlug?: string): Promise<TaskItem[]> => {
  return db
    .select({
      slug: task.slug,
      editionId: edition.id,
      roundSlug: round.slug,
    })
    .from(task)
    .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
    .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)))
    .where(
      and(
        eq(edition.id, editionId ?? "").if(editionId),
        eq(round.slug, roundSlug ?? "").if(roundSlug),
      ),
    )
    .orderBy(task.slug);
});

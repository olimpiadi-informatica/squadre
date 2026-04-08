import { cache } from "react";

import { and, eq, notInArray, sql } from "drizzle-orm";

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

export type RoundTaskItem = {
  slug: string;
  title: string;
  junior: boolean;
  regular: boolean;
};

export function listRoundTasks(
  editionId: string,
  roundSlug: string,
  junior: boolean,
): Promise<(RoundTaskItem & { id: number })[]> {
  return db
    .select({
      id: task.id,
      slug: task.slug,
      title: task.title,
      junior: task.junior,
      regular: task.regular,
    })
    .from(task)
    .innerJoin(round, eq(round.id, task.roundId))
    .where(
      and(
        eq(round.editionId, editionId),
        eq(round.slug, roundSlug),
        eq(task.regular, true).if(!junior),
        eq(task.junior, true).if(junior),
      ),
    )
    .orderBy(task.slug);
}

export async function saveRoundTasksForRound(
  roundId: number,
  tasks: RoundTaskItem[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(task).where(
      and(
        eq(task.roundId, roundId),
        notInArray(
          task.slug,
          tasks.map((t) => t.slug),
        ),
      ),
    );
    await tx
      .insert(task)
      .values(
        tasks.map((t) => ({
          slug: t.slug,
          roundId: roundId,
          title: t.title,
          statement: "",
          junior: t.junior,
          regular: t.regular,
        })),
      )
      .onConflictDoUpdate({
        target: [task.slug, task.roundId],
        set: {
          title: sql.raw(`EXCLUDED.${task.title.name}`),
          junior: sql.raw(`EXCLUDED.${task.junior.name}`),
          regular: sql.raw(`EXCLUDED.${task.regular.name}`),
        },
      });
  });
}

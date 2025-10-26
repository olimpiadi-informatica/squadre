import { cache } from "react";

import { and, countDistinct, desc, eq, max, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, task, taskScore, team } from "~/lib/db/schema";
import { coalesce, concat } from "~/lib/utils";

export type Edition = {
  name: string;
  year: string;
};

export const getEdition = cache(async (id: string): Promise<Edition> => {
  const [result] = await db
    .select({
      name: edition.title,
      year: edition.year,
    })
    .from(edition)
    .where(eq(edition.id, id));
  if (!result) throw new Error(`Edition ${id} not found`);
  return result;
});

export type EditionStats = {
  totalTasks: number;
  totalTeams: number;
  totalInstitutes: number;
  totalPoints: number;
};

export const getEditionStats = cache(async (id?: string): Promise<EditionStats> => {
  const [result] = await db
    .select({
      totalTasks: countDistinct(taskScore.taskName),
      totalTeams: countDistinct(concat(team.editionId, "-", team.id)),
      totalInstitutes: countDistinct(team.instId),
      totalPoints: coalesce(sum(taskScore.score), 0),
    })
    .from(team)
    .leftJoin(
      taskScore,
      and(eq(team.editionId, taskScore.editionId), eq(team.id, taskScore.teamId)),
    )
    .where(eq(team.editionId, id ?? "").if(id));
  return result;
});

export type EditionItem = {
  id: string;
  name: string;
  year: string;
  totalInstitutes: number;
  totalTeams: number;
  totalPoints: number;
  totalTasks: number;
  highestPoints: number;
};

export const listEditions = cache((): Promise<EditionItem[]> => {
  return db
    .select({
      id: edition.id,
      name: edition.title,
      year: edition.year,
      totalInstitutes: countDistinct(team.instId),
      totalTeams: countDistinct(concat(team.editionId, "-", team.id)),
      totalPoints: coalesce(sum(team.points), 0),
      highestPoints: coalesce(max(team.points), 0),
      totalTasks: db.$count(task, eq(task.editionId, edition.id)),
    })
    .from(edition)
    .innerJoin(team, eq(team.editionId, edition.id))
    .groupBy(edition.id)
    .orderBy(desc(edition.year));
});

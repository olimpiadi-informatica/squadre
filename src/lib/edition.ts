import { cache } from "react";

import { and, countDistinct, desc, eq, max, sql, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, round, task, taskScore, team, teamRound } from "~/lib/db/schema";
import { coalesce, concat } from "~/lib/utils";

export async function updateEditionVisibility(id: string, isPublic: boolean): Promise<void> {
  await db.update(edition).set({ public: isPublic }).where(eq(edition.id, id));
}

export async function deleteEdition(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(taskScore).where(eq(taskScore.editionId, id));
    await tx.delete(teamRound).where(eq(teamRound.editionId, id));
    await tx.delete(task).where(eq(task.editionId, id));
    await tx.delete(team).where(eq(team.editionId, id));
    await tx.delete(round).where(eq(round.editionId, id));
    await tx.delete(edition).where(eq(edition.id, id));
  });
}

export type ScheduleEdition = {
  year: string;
  rounds: { id: string; name: string; startsAt: Date }[];
};

export const getLatestSchedule = cache(async (): Promise<ScheduleEdition> => {
  const [latestEdition] = await db
    .select()
    .from(edition)
    .where(eq(edition.public, true))
    .orderBy(desc(edition.year))
    .limit(1);
  if (!latestEdition) throw new Error("No edition found");

  const rounds = await db
    .select({
      id: round.id,
      name: round.title,
      startsAt: round.startsAt,
    })
    .from(round)
    .where(eq(round.editionId, latestEdition.id))
    .orderBy(round.startsAt, round.id);

  return {
    year: latestEdition.year,
    rounds,
  };
});

export type Edition = {
  name: string;
  year: string;
};

export const getEdition = cache(async (id: string): Promise<Edition | undefined> => {
  const [result] = await db
    .select({
      name: edition.title,
      year: edition.year,
    })
    .from(edition)
    .where(and(eq(edition.id, id), eq(edition.public, true)));
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
      totalTeams: countDistinct(concat(team.editionId, sql`'-'`, team.id)),
      totalInstitutes: countDistinct(team.instId),
      totalPoints: coalesce(sum(taskScore.score), 0),
    })
    .from(team)
    .leftJoin(
      taskScore,
      and(eq(team.editionId, taskScore.editionId), eq(team.id, taskScore.teamId)),
    )
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, true)))
    .innerJoin(
      task,
      and(eq(taskScore.taskName, task.name), eq(taskScore.editionId, task.editionId)),
    )
    .innerJoin(
      round,
      and(eq(task.roundId, round.id), eq(task.editionId, round.editionId), eq(round.public, true)),
    )
    .where(and(eq(team.editionId, id ?? "").if(id), eq(team.junior, false)));
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
      totalTeams: countDistinct(concat(team.editionId, sql`'-'`, team.id)),
      totalPoints: coalesce(sum(team.points), 0),
      highestPoints: coalesce(max(team.points), 0),
      totalTasks: db.$count(task, eq(task.editionId, edition.id)),
    })
    .from(edition)
    .innerJoin(team, eq(team.editionId, edition.id))
    .where(and(eq(edition.public, true), eq(team.junior, false)))
    .groupBy(edition.id)
    .orderBy(desc(edition.year));
});

export type EditionAdminItem = {
  id: string;
  name: string;
  year: string;
  public: boolean;
};

export const getEditionAdmin = cache(async (id: string): Promise<EditionAdminItem | undefined> => {
  const [result] = await db
    .select({
      id: edition.id,
      name: edition.title,
      year: edition.year,
      public: edition.public,
    })
    .from(edition)
    .where(eq(edition.id, id));
  return result;
});

export const listEditionsAdmin = cache((): Promise<EditionAdminItem[]> => {
  return db
    .select({
      id: edition.id,
      name: edition.title,
      year: edition.year,
      public: edition.public,
    })
    .from(edition)
    .orderBy(desc(edition.year));
});

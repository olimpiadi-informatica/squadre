import { cache } from "react";

import { and, countDistinct, desc, eq, max, sum } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition, round, task, taskScore, team, teamRound } from "~/lib/db/schema";
import { coalesce, concat } from "~/lib/utils";

export async function updateEditionVisibility(id: string, isPublic: number): Promise<void> {
  await db.update(edition).set({ public: isPublic }).where(eq(edition.id, id));
}

export async function deleteEdition(id: string): Promise<void> {
  // await db.transaction(async (tx) => {
  await db.delete(taskScore).where(eq(taskScore.editionId, id));
  await db.delete(teamRound).where(eq(teamRound.editionId, id));
  await db.delete(task).where(eq(task.editionId, id));
  await db.delete(team).where(eq(team.editionId, id));
  await db.delete(round).where(eq(round.editionId, id));
  await db.delete(edition).where(eq(edition.id, id));
  // });
}

export type ScheduleEdition = {
  year: string;
  rounds: Date[];
  final: Date;
};

export const getLatestSchedule = cache(async (): Promise<ScheduleEdition> => {
  const [latestEdition] = await db
    .select()
    .from(edition)
    .where(eq(edition.public, 1))
    .orderBy(desc(edition.year))
    .limit(1);
  if (!latestEdition) throw new Error("No edition found");

  const roundsData = await db.select().from(round).where(eq(round.editionId, latestEdition.id));
  const order = ["1", "2", "3", "4", "final"];
  roundsData.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return {
    year: latestEdition.year,
    rounds: roundsData.filter((r) => r.id !== "final").map((r) => r.startsAt),
    final: roundsData.find((r) => r.id === "final")?.startsAt || new Date(0),
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
    .where(and(eq(edition.id, id), eq(edition.public, 1)));
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
    .innerJoin(edition, and(eq(team.editionId, edition.id), eq(edition.public, 1)))
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
    .where(eq(edition.public, 1))
    .groupBy(edition.id)
    .orderBy(desc(edition.year));
});

export type EditionAdminItem = {
  id: string;
  name: string;
  year: string;
  public: number;
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

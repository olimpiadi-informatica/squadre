import { cache } from "react";

import { and, countDistinct, desc, eq, sum } from "drizzle-orm";

import { db } from "./db";
import { edition, institute, round, v05a_editionStats, v06a_editionStats2 } from "./db/schema";
import { coalesce } from "./db/utils";
import { regularRoundsOnly } from "./round";

export type ScheduleEdition = {
  year: string;
  rounds: { id: string; name: string; startsAt: Date }[];
};

export const getLatestSchedule = cache(async (): Promise<ScheduleEdition> => {
  const [latestEdition] = await db
    .select({
      id: edition.id,
      year: edition.year,
    })
    .from(edition)
    .where(eq(edition.public, true))
    .orderBy(desc(edition.year))
    .limit(1);
  if (!latestEdition) throw new Error("No edition found");

  const rounds = await db
    .select({
      id: round.slug,
      name: round.title,
      startsAt: round.startsAt,
    })
    .from(round)
    .where(and(eq(round.editionId, latestEdition.id), regularRoundsOnly))
    .orderBy(round.startsAt, round.slug);

  return {
    year: latestEdition.year,
    rounds,
  };
});

export type Edition = {
  id: string;
  name: string;
  year: string;
  totalInstitutes: number;
  totalTeams: number;
  totalScores: number;
  totalTasks: number;
  highestPoints: number;
};

export const listEditions = cache((editionId?: string): Promise<Edition[]> => {
  return db
    .select({
      id: edition.id,
      name: edition.title,
      year: edition.year,
      totalTeams: v05a_editionStats.totalTeams,
      totalScores: v05a_editionStats.totalScores,
      highestPoints: v05a_editionStats.highestScore,
      totalInstitutes: v06a_editionStats2.totalInstitutes,
      totalTasks: v06a_editionStats2.totalTasks,
    })
    .from(edition)
    .innerJoin(v05a_editionStats, eq(v05a_editionStats.editionId, edition.id))
    .innerJoin(v06a_editionStats2, eq(v06a_editionStats2.editionId, edition.id))
    .where(eq(edition.id, editionId ?? "").if(editionId))
    .orderBy(desc(edition.year));
});

export const getEdition = cache(async (id: string): Promise<Edition | undefined> => {
  const [result] = await listEditions(id);
  return result;
});

export type Stats = {
  totalEditions: number;
  totalTasks: number;
  totalTeams: number;
  totalInstitutes: number;
  totalScores: number;
};

export const getStats = cache(async (): Promise<Stats> => {
  const [result] = await db
    .select({
      totalEditions: countDistinct(v05a_editionStats.editionId),
      totalTeams: coalesce(sum(v05a_editionStats.totalTeams), 0),
      totalScores: coalesce(sum(v05a_editionStats.totalScores), 0),
      totalInstitutes: db.$count(institute),
      totalTasks: coalesce(sum(v06a_editionStats2.totalTasks), 0),
    })
    .from(v05a_editionStats)
    .innerJoin(v06a_editionStats2, eq(v06a_editionStats2.editionId, v05a_editionStats.editionId));
  return result;
});

export type EditionAdminItem = {
  id: string;
  name: string;
  year: string;
};

export const getEditionAdmin = cache(async (id: string): Promise<EditionAdminItem | undefined> => {
  const [result] = await db
    .select({
      id: edition.id,
      name: edition.title,
      year: edition.year,
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
    })
    .from(edition)
    .orderBy(desc(edition.year));
});

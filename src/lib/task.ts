import { cache } from "react";

import { and, eq, notInArray, sql } from "drizzle-orm";

import {
  ESORDIENTI,
  finalOnlyRegular,
  membership,
  REGOLARI,
  sortChampionships,
} from "./championship";
import { db } from "./db";
import {
  edition,
  round,
  task,
  teamChampionship,
  teamRound,
  teamTaskScore,
  v00a_taskStats,
} from "./db/schema";

export type TaskStats = {
  teamScored: number;
  totalScores: number;
  maxScore: number;
  avgScore: number;
  medianScore: number;
};

export type Task = {
  slug: string;
  title: string;
  editionId: string;
  editionName: string;
  roundSlug: string;
  roundName: string;
  /**
   * Le statistiche del task, per ciascun campionato che vi ha gareggiato: un
   * task "condiviso" ha classifiche parallele, uno solo degli esordienti
   * un'unica voce.
   */
  championships: { championship: string; stats: TaskStats }[];
};

export const getTask = cache(
  async (editionId: string, roundSlug: string, taskSlug: string): Promise<Task | undefined> => {
    const [base] = await db
      .select({
        id: task.id,
        slug: task.slug,
        title: task.title,
        editionId: edition.id,
        editionName: edition.title,
        roundSlug: round.slug,
        roundName: round.title,
      })
      .from(task)
      .innerJoin(round, eq(round.id, task.roundId))
      .innerJoin(edition, eq(edition.id, round.editionId))
      .where(and(eq(edition.id, editionId), eq(round.slug, roundSlug), eq(task.slug, taskSlug)));
    if (!base) return undefined;

    const stats = await db
      .select({
        championship: v00a_taskStats.championship,
        teamScored: v00a_taskStats.teamScored,
        totalScores: v00a_taskStats.totalScores,
        maxScore: v00a_taskStats.maxScore,
        avgScore: v00a_taskStats.avgScore,
        medianScore: v00a_taskStats.medianScore,
      })
      .from(v00a_taskStats)
      .where(eq(v00a_taskStats.taskId, base.id));
    if (stats.length === 0) return undefined;

    const { id: _id, ...rest } = base;
    const byChampionship = new Map(stats.map((row) => [row.championship, row]));
    return {
      ...rest,
      // ordine dei tab: prima i regolari
      championships: sortChampionships([...byChampionship.keys()]).flatMap((championship) => {
        const row = byChampionship.get(championship);
        if (!row) return [];
        const { championship: _championship, ...values } = row;
        return [{ championship, stats: values }];
      }),
    };
  },
);

export type TaskItem = {
  slug: string;
  editionId: string;
  roundSlug: string;
};

/**
 * Task di un'edizione. Per i campionati non-regolari restituisce solo i task
 * che quel campionato ha effettivamente gareggiato.
 */
export const listTasks = cache(
  (
    editionId?: string,
    roundSlug?: string,
    championship: string = REGOLARI,
  ): Promise<TaskItem[]> => {
    const base = db
      .select({
        slug: task.slug,
        editionId: edition.id,
        roundSlug: round.slug,
      })
      .from(task)
      .innerJoin(round, and(eq(round.id, task.roundId), eq(round.public, true)))
      .innerJoin(edition, and(eq(edition.id, round.editionId), eq(edition.public, true)));

    const where = and(
      eq(edition.id, editionId ?? "").if(editionId),
      eq(round.slug, roundSlug ?? "").if(roundSlug),
      finalOnlyRegular(championship),
    );

    if (championship === REGOLARI) {
      // Un round può ospitare anche i task degli esordienti: i regolari
      // gareggiano solo sui propri.
      return base.where(and(where, eq(task.regular, true))).orderBy(task.slug);
    }

    return base
      .innerJoin(teamRound, eq(teamRound.roundId, round.id))
      .innerJoin(teamChampionship, membership(championship, teamRound.teamId))
      .innerJoin(
        teamTaskScore,
        and(eq(teamTaskScore.teamId, teamChampionship.teamId), eq(teamTaskScore.taskId, task.id)),
      )
      .where(where)
      .groupBy(task.slug, edition.id, round.slug)
      .orderBy(task.slug);
  },
);

export type RoundTaskItem = {
  slug: string;
  title: string;
  junior: boolean;
  regular: boolean;
  scoredTeams: number;
  scoredJuniors: number;
  scoredRegulars: number;
};

const scoredTeamsSql = sql<number>`(SELECT count(*)::int FROM ${teamTaskScore} WHERE ${teamTaskScore.taskId} = ${task.id})`;
const scoredJuniorsSql = sql<number>`(SELECT count(*)::int FROM ${teamTaskScore} INNER JOIN ${teamChampionship} ON ${teamChampionship.teamId} = ${teamTaskScore.teamId} WHERE ${teamTaskScore.taskId} = ${task.id} AND ${teamChampionship.championship} = ${ESORDIENTI})`;
const scoredRegularsSql = sql<number>`(SELECT count(*)::int FROM ${teamTaskScore} INNER JOIN ${teamChampionship} ON ${teamChampionship.teamId} = ${teamTaskScore.teamId} WHERE ${teamTaskScore.taskId} = ${task.id} AND ${teamChampionship.championship} = ${REGOLARI})`;

export const listAllRoundTasks = cache(
  (editionId: string, roundSlug: string): Promise<RoundTaskItem[]> => {
    return db
      .select({
        slug: task.slug,
        title: task.title,
        junior: task.junior,
        regular: task.regular,
        scoredTeams: scoredTeamsSql,
        scoredJuniors: scoredJuniorsSql,
        scoredRegulars: scoredRegularsSql,
      })
      .from(task)
      .innerJoin(round, eq(round.id, task.roundId))
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
      .orderBy(task.slug);
  },
);

export function listRoundTasks(
  editionId: string,
  roundSlug: string,
  junior: boolean,
): Promise<
  (Omit<RoundTaskItem, "scoredTeams" | "scoredJuniors" | "scoredRegulars"> & { id: number })[]
> {
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

export async function validateRoundTaskUpdate(
  roundId: number,
  tasks: RoundTaskItem[],
): Promise<void> {
  const existing = await db
    .select({
      slug: task.slug,
      junior: task.junior,
      regular: task.regular,
      scoredTeams: scoredTeamsSql,
      scoredJuniors: scoredJuniorsSql,
      scoredRegulars: scoredRegularsSql,
    })
    .from(task)
    .innerJoin(round, eq(round.id, task.roundId))
    .where(eq(task.roundId, roundId));

  const inputBySlug = new Map(tasks.map((t) => [t.slug, t]));
  for (const task of existing) {
    const next = inputBySlug.get(task.slug);
    if (!next) {
      if (task.scoredTeams > 0) {
        throw new Error(`Il task ${task.slug} ha già risultati e non può essere eliminato.`);
      }
      continue;
    }
    if (next.junior !== task.junior && task.scoredJuniors > 0) {
      throw new Error(`Il task ${task.slug} ha già risultati nella categoria junior.`);
    }
    if (next.regular !== task.regular && task.scoredRegulars > 0) {
      throw new Error(`Il task ${task.slug} ha già risultati nella categoria regular.`);
    }
  }
}

export async function saveRoundTasksForRound(
  roundId: number,
  tasks: RoundTaskItem[],
): Promise<void> {
  await db.transaction(async (tx) => {
    if (tasks.length === 0) {
      await tx.delete(task).where(eq(task.roundId, roundId));
      return;
    }
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

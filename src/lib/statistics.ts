import { and, asc, eq, isNotNull, isNull, notExists, or } from "drizzle-orm";

import { db } from "~/lib/db";
import {
  institute,
  penalization,
  region,
  task,
  team,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
} from "~/lib/db/schema";

// Punteggio pieno di un singolo problema
const FULL_TASK_SCORE = 100;

export type TaskStats = {
  id: number;
  slug: string;
  title: string;
  totalPoints: number;
  fullScores: number;
  positiveScores: number;
  correlation: number | null;
};

export type RegionStats = {
  id: string;
  name: string;
  points: number;
  positives: number;
};

export type RoundStatistics = {
  participants: number;
  averagePoints: number;
  tasks: TaskStats[];
  regions: RegionStats[];
};

export async function getRoundStatistics(roundId: number): Promise<RoundStatistics> {
  const [regions, tasks, scores] = await Promise.all([
    db.select({ id: region.id, name: region.name }).from(region).orderBy(asc(region.name)),
    db
      .select({ id: task.id, slug: task.slug, title: task.title })
      .from(task)
      .where(eq(task.roundId, roundId))
      .orderBy(asc(task.slug)),
    db
      .select({
        taskId: teamTaskScore.taskId,
        teamId: teamTaskScore.teamId,
        regionId: institute.region,
        score: teamTaskScore.score,
      })
      .from(teamTaskScore)
      .innerJoin(task, and(eq(task.id, teamTaskScore.taskId), eq(task.roundId, roundId)))
      .innerJoin(
        team,
        and(eq(team.id, teamTaskScore.teamId), eq(team.junior, false), eq(team.hidden, false)),
      )
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(teamRound, and(eq(teamRound.teamId, team.id), eq(teamRound.roundId, roundId)))
      .where(
        // Squadre squalificate in questo round (penalizzazione rossa inviata e non annullata
        // in appello): escluse come nei fogli, dove il loro totale è zero
        notExists(
          db
            .select({ id: teamRoundPenalization.id })
            .from(teamRoundPenalization)
            .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
            .where(
              and(
                eq(teamRoundPenalization.teamRoundId, teamRound.id),
                eq(penalization.level, "red"),
                isNotNull(penalization.sentAt),
                or(isNull(penalization.appealApproved), eq(penalization.appealApproved, false)),
              ),
            ),
        ),
      ),
  ]);

  // Punti totali di ogni squadra nel round
  const teamTotals = new Map<number, number>();
  const teamRegion = new Map<number, string>();
  const scoresByTask = new Map<number, typeof scores>();
  for (const s of scores) {
    teamTotals.set(s.teamId, (teamTotals.get(s.teamId) ?? 0) + s.score);
    teamRegion.set(s.teamId, s.regionId);

    const taskScores = scoresByTask.get(s.taskId) ?? [];
    taskScores.push(s);
    scoresByTask.set(s.taskId, taskScores);
  }

  const participantTotals = [...teamTotals.values()].filter((p) => p > 0);
  const participants = participantTotals.length;
  const totalPoints = participantTotals.reduce((acc, p) => acc + p, 0);

  const taskStats: TaskStats[] = tasks.map((t) => {
    const taskScores = scoresByTask.get(t.id) ?? [];
    const positive = taskScores.filter((s) => s.score > 0);

    // Per ogni squadra con punteggio positivo: quota del proprio totale nel round
    const share = positive.reduce((acc, s) => {
      const teamTotal = teamTotals.get(s.teamId) ?? 0;
      return teamTotal > 0 ? acc + s.score / teamTotal : acc;
    }, 0);

    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      totalPoints: taskScores.reduce((acc, s) => acc + s.score, 0),
      fullScores: taskScores.filter((s) => s.score === FULL_TASK_SCORE).length,
      positiveScores: positive.length,
      correlation: participants > 0 ? share / participants : null,
    };
  });

  const regionStats: RegionStats[] = regions.map((reg) => ({
    id: reg.id,
    name: reg.name,
    points: 0,
    positives: 0,
  }));
  const regionById = new Map(regionStats.map((reg) => [reg.id, reg]));
  for (const [teamId, total] of teamTotals) {
    const reg = regionById.get(teamRegion.get(teamId) ?? "");
    if (!reg) continue;

    reg.points += total;
    if (total > 0) reg.positives += 1;
  }

  return {
    participants,
    averagePoints: participants > 0 ? Math.round(totalPoints / participants) : 0,
    tasks: taskStats,
    regions: regionStats,
  };
}

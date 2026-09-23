import { and, eq } from "drizzle-orm";

import { db } from "~/lib/db";
import { round, team, teamRound } from "~/lib/db/schema";

export type ParticipationStats = {
  totalTeams: number;
  loggedCount: number;
  loggedPercent: number;
  submittedCount: number;
  submittedPercent: number;
  scoredCount: number;
  scoredPercent: number;
};

export async function getRoundParticipationStats(
  editionId: string,
  roundSlug: string,
): Promise<ParticipationStats> {
  const teams = await db
    .select({
      participationStatus: teamRound.participationStatus,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug), eq(team.hidden, false)));

  const totalTeams = teams.length;
  const loggedCount = teams.filter((t) => t.participationStatus != null).length;
  const submittedCount = teams.filter(
    (t) => t.participationStatus === "submitted" || t.participationStatus === "scored",
  ).length;
  const scoredCount = teams.filter((t) => t.participationStatus === "scored").length;

  const loggedPercent = totalTeams > 0 ? Math.round((loggedCount / totalTeams) * 100) : 0;
  const submittedPercent = loggedCount > 0 ? Math.round((submittedCount / loggedCount) * 100) : 0;
  const scoredPercent = submittedCount > 0 ? Math.round((scoredCount / submittedCount) * 100) : 0;

  return {
    totalTeams,
    loggedCount,
    loggedPercent,
    submittedCount,
    submittedPercent,
    scoredCount,
    scoredPercent,
  };
}

export type ParticipationFileType = "logged" | "submitted" | "scored";

export async function getParticipationFileContent(
  editionId: string,
  roundSlug: string,
  fileType: ParticipationFileType,
): Promise<string> {
  const teams = await db
    .select({
      slug: team.slug,
      participationStatus: teamRound.participationStatus,
    })
    .from(teamRound)
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug), eq(team.hidden, false)));

  let filteredSlugs: string[] = [];

  if (fileType === "logged") {
    filteredSlugs = teams.filter((t) => t.participationStatus != null).map((t) => t.slug);
  } else if (fileType === "submitted") {
    filteredSlugs = teams
      .filter((t) => t.participationStatus === "submitted" || t.participationStatus === "scored")
      .map((t) => t.slug);
  } else if (fileType === "scored") {
    filteredSlugs = teams.filter((t) => t.participationStatus === "scored").map((t) => t.slug);
  }

  filteredSlugs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return filteredSlugs.length > 0 ? `${filteredSlugs.join("\n")}\n` : "";
}

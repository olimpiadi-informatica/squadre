import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { submission, task, teamRound } from "./db/schema";

export type TeamRoundSubmission = {
  timestamp: Date;
  taskSlug: string;
};

export function getTeamRoundSubmissions(
  roundId: number,
  teamId: number,
): Promise<TeamRoundSubmission[]> {
  return db
    .select({
      timestamp: submission.timestamp,
      taskSlug: task.slug,
    })
    .from(submission)
    .innerJoin(teamRound, eq(teamRound.id, submission.teamRoundId))
    .innerJoin(task, eq(task.id, submission.taskId))
    .where(and(eq(teamRound.roundId, roundId), eq(teamRound.teamId, teamId)))
    .orderBy(submission.timestamp, task.slug);
}

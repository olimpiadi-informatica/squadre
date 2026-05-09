import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

import { and, countDistinct, eq, exists, gt, inArray, min, notExists, sql } from "drizzle-orm";
import { flatMapAsync } from "es-toolkit";
import { isString } from "es-toolkit/compat";
import Papa from "papaparse";

import { db } from "./db";
import {
  institute,
  internetCheck,
  type PenalizationLevel,
  type PenalizationType,
  penalization,
  round,
  submission,
  task,
  team,
  teamRound,
  teamRoundPenalization,
  teamTaskScore,
} from "./db/schema";

type InternetPenalizationFilters = {
  missingThreshold: number;
  failedThreshold: number;
};

export type RoundPenalization = {
  id: number;
  teams: string;
  instituteName: string | null;
  instituteCity: string | null;
  roundSlug: string;
  editionId: string;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
  createdAt: Date;
  appealAllowed: boolean;
};

export function listRoundPenalization(
  editionId: string,
  roundSlug: string,
): Promise<RoundPenalization[]> {
  return db
    .select({
      id: penalization.id,
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      instituteName: min(institute.name),
      instituteCity: min(institute.city),
      roundSlug: round.slug,
      editionId: round.editionId,
      level: penalization.level,
      type: penalization.type,
      description: penalization.description,
      createdAt: penalization.createdAt,
      appealAllowed: penalization.appealAllowed,
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .groupBy(
      penalization.id,
      penalization.level,
      penalization.type,
      penalization.description,
      penalization.createdAt,
      penalization.appealAllowed,
      round.slug,
      round.editionId,
    )
    .orderBy((t) => [t.instituteName, t.instituteCity, t.teams]);
}

export type RoundPenalizationDetail = {
  id: number;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
  createdAt: Date;
  appealAllowed: boolean;
  teamRoundPenalizationIds: number[];
};

export async function getRoundPenalization(
  roundId: number,
  penalizationId: number,
): Promise<RoundPenalizationDetail | undefined> {
  const [item] = await db
    .select({
      id: penalization.id,
      level: penalization.level,
      type: penalization.type,
      description: penalization.description,
      createdAt: penalization.createdAt,
      appealAllowed: penalization.appealAllowed,
      teamRoundPenalizationIds: sql<number[]>`ARRAY_AGG(${teamRoundPenalization.id})`,
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .where(and(eq(teamRound.roundId, roundId), eq(penalization.id, penalizationId)))
    .groupBy(
      penalization.id,
      penalization.level,
      penalization.type,
      penalization.description,
      penalization.createdAt,
      penalization.appealAllowed,
    );
  return item;
}

export type TeamPenalizationDetail = {
  id: number;
  slug: string;
  name: string;
  instituteName: string;
  instituteCity: string;
  delay: number;
  submissionId: number | null;
  submissionSlug: string | null;
  submissionScore: number | null;
  submissionTimestamp: Date | null;
  submissionLanguage: string | null;
  submissionCode: string | null;
  taskSlug: string | null;
  taskTitle: string | null;
};

export function getTeamPenalization(
  teamRoundPenalizationIds: number[],
): Promise<TeamPenalizationDetail[]> {
  return db
    .select({
      id: team.id,
      slug: team.slug,
      name: team.name,
      instituteName: institute.name,
      instituteCity: institute.city,
      delay: teamRound.delay,
      submissionId: submission.id,
      submissionSlug: submission.slug,
      submissionScore: submission.score,
      submissionTimestamp: submission.timestamp,
      submissionLanguage: submission.language,
      submissionCode: submission.code,
      taskSlug: task.slug,
      taskTitle: task.title,
    })
    .from(teamRoundPenalization)
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .leftJoin(submission, eq(submission.id, teamRoundPenalization.submissionId))
    .leftJoin(task, eq(task.id, submission.taskId))
    .where(inArray(teamRoundPenalization.id, teamRoundPenalizationIds))
    .orderBy(teamRoundPenalization.id);
}

export async function importRoundPlagiarismPenalization(
  editionId: string,
  roundSlug: string,
  files: FormDataEntryValue[],
) {
  const rows = await flatMapAsync(files, parsePlagiarismTsv);
  if (rows.length === 0) {
    throw new Error("I file TSV non contengono righe valide.");
  }

  const submissionSlugs = [
    ...new Set(rows.flatMap((row) => [row.firstSubmissionSlug, row.secondSubmissionSlug])),
  ];

  await db.transaction(async (tx) => {
    const owners = await tx
      .select({
        submissionId: submission.id,
        submissionSlug: submission.slug,
        teamRoundId: teamRound.id,
        teamSlug: team.slug,
        teamName: team.name,
        instituteEmail: institute.email,
      })
      .from(submission)
      .innerJoin(teamRound, eq(teamRound.id, submission.teamRoundId))
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .where(
        and(
          eq(round.editionId, editionId),
          eq(round.slug, roundSlug),
          inArray(submission.slug, submissionSlugs),
        ),
      );

    const roundTeamRounds = await tx
      .select({ id: teamRound.id })
      .from(teamRound)
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));

    if (roundTeamRounds.length === 0) {
      throw new Error("Nessun team trovato per questo round.");
    }

    const ownerBySubmissionSlug = new Map(owners.map((owner) => [owner.submissionSlug, owner]));

    for (const row of rows) {
      const firstTeam = ownerBySubmissionSlug.get(row.firstSubmissionSlug);
      if (!firstTeam) {
        throw new Error(`Submission ${row.firstSubmissionSlug} non trovata.`);
      }
      const secondTeam = ownerBySubmissionSlug.get(row.secondSubmissionSlug);
      if (!secondTeam) {
        throw new Error(`Submission ${row.secondSubmissionSlug} non trovata.`);
      }

      const [{ penalizationId }] = await tx
        .insert(penalization)
        .values({
          level: "yellow",
          type: "plagiarism",
          description: row.details,
          createdAt: new Date(),
          appealAllowed: true,
        })
        .returning({ penalizationId: penalization.id });
      await tx.insert(teamRoundPenalization).values([
        {
          penalizationId: penalizationId,
          teamRoundId: firstTeam.teamRoundId,
          submissionId: firstTeam.submissionId,
        },
        {
          penalizationId: penalizationId,
          teamRoundId: secondTeam.teamRoundId,
          submissionId: secondTeam.submissionId,
        },
      ]);
    }
  });
}

export async function createRoundInternetPenalization(
  editionId: string,
  roundSlug: string,
  { missingThreshold, failedThreshold }: InternetPenalizationFilters,
) {
  await db.transaction(async (tx) => {
    const teamRounds = await tx
      .select({
        teamRoundId: teamRound.id,
        numPc: countDistinct(internetCheck.pcHash),
        numFailedChecks: sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "failed")})`,
        numMissingChecks: sql<number>`COUNT(*) FILTER (WHERE ${eq(internetCheck.status, "missing")})`,
      })
      .from(teamRound)
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .leftJoin(internetCheck, eq(internetCheck.teamRoundId, teamRound.id))
      .where(
        and(
          eq(round.editionId, editionId),
          eq(round.slug, roundSlug),
          exists(
            tx
              .select()
              .from(teamTaskScore)
              .innerJoin(task, eq(task.id, teamTaskScore.taskId))
              .where(
                and(
                  eq(teamTaskScore.teamId, teamRound.teamId),
                  eq(task.roundId, teamRound.roundId),
                  gt(teamTaskScore.score, 0),
                ),
              ),
          ),
          notExists(
            tx
              .select()
              .from(teamRoundPenalization)
              .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
              .where(
                and(
                  eq(teamRoundPenalization.teamRoundId, teamRound.id),
                  eq(penalization.type, "internet-check"),
                ),
              ),
          ),
        ),
      )
      .groupBy(teamRound.id)
      .having(
        ({ numPc, numFailedChecks, numMissingChecks }) => sql`
          ${numPc} > 2
          OR ${numFailedChecks} >= ${failedThreshold}
          OR ${numMissingChecks} >= ${missingThreshold}
        `,
      );

    for (const item of teamRounds) {
      const reasons = [];
      if (item.numPc > 2) {
        reasons.push("troppi pc");
      }
      if (item.numFailedChecks >= failedThreshold) {
        reasons.push("controlli internet falliti");
      }
      if (item.numMissingChecks >= missingThreshold) {
        reasons.push("controlli internet mancanti");
      }

      const [{ penalizationId }] = await tx
        .insert(penalization)
        .values({
          level: "yellow",
          type: "internet-check",
          description: reasons.join(", "),
          createdAt: new Date(),
          appealAllowed: true,
        })
        .returning({ penalizationId: penalization.id });

      await tx.insert(teamRoundPenalization).values({
        penalizationId,
        teamRoundId: item.teamRoundId,
      });
    }
  });
}

async function parsePlagiarismTsv(tsv: File | string) {
  const source = isString(tsv) ? tsv : Readable.fromWeb(tsv.stream() as ReadableStream);

  const rows = await new Promise<string[][]>((resolve, reject) => {
    Papa.parse(source, {
      delimiter: "\t",
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data as string[][]);
        }
      },
    });
  });

  return rows.map((columns, index) => {
    const lineNumber = index + 1;
    const [firstPath = "", secondPath = "", details] = columns;

    if (!firstPath.trim() || !secondPath.trim() || !details) {
      throw new Error(`Riga ${lineNumber}: il TSV deve contenere due path e una descrizione.`);
    }

    return {
      firstSubmissionSlug: parseSubmissionSlug(firstPath, lineNumber),
      secondSubmissionSlug: parseSubmissionSlug(secondPath, lineNumber),
      details,
    };
  });
}

function parseSubmissionSlug(rawPath: string, lineNumber: number) {
  const match = /^(?<slug>\d+)\.\w+\.(?<language>\w+)$/u.exec(path.basename(rawPath));
  if (!match?.groups) {
    throw new Error(`Riga ${lineNumber}: nome file non valido "${rawPath}".`);
  }

  return match.groups.slug;
}

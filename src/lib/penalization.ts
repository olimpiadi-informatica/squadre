import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

import { cache } from "react";

import { and, desc, eq, inArray } from "drizzle-orm";
import { flatMapAsync } from "es-toolkit";
import { isString } from "es-toolkit/compat";
import Papa from "papaparse";

import { db } from "./db";
import { institute, penalization, round, submission, team, teamRound } from "./db/schema";

export type RoundPenalization = {
  id: number;
  teamSlug: string;
  teamName: string;
  instituteName: string;
  instituteCity: string;
  level: "yellow" | "red";
  type: "screen-recording" | "internet-check" | "plagiarism" | "ai" | "other";
  description: string;
  createdAt: Date;
  appealAllowed: boolean;
};

export const listRoundPenalization = cache(
  (editionId: string, roundSlug: string): Promise<RoundPenalization[]> => {
    return db
      .select({
        id: penalization.id,
        teamSlug: team.slug,
        teamName: team.name,
        instituteName: institute.name,
        instituteCity: institute.city,
        level: penalization.level,
        type: penalization.type,
        description: penalization.description,
        createdAt: penalization.createdAt,
        appealAllowed: penalization.appealAllowed,
      })
      .from(penalization)
      .innerJoin(teamRound, eq(teamRound.id, penalization.teamRoundId))
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(institute, eq(institute.id, team.instituteId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
      .orderBy(desc(penalization.createdAt), team.slug, penalization.id);
  },
);

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

    const penalizations: (typeof penalization.$inferInsert)[] = [];

    for (const row of rows) {
      const firstTeam = ownerBySubmissionSlug.get(row.firstSubmissionSlug);
      if (!firstTeam) {
        throw new Error(`Submission ${row.firstSubmissionSlug} non trovata.`);
      }
      const secondTeam = ownerBySubmissionSlug.get(row.secondSubmissionSlug);
      if (!secondTeam) {
        throw new Error(`Submission ${row.secondSubmissionSlug} non trovata.`);
      }

      penalizations.push({
        teamRoundId: firstTeam.teamRoundId,
        relatedTeamRoundId: secondTeam.teamRoundId,
        level: "yellow",
        type: "plagiarism",
        submissionId: firstTeam.submissionId,
        relatedSubmissionId: secondTeam.submissionId,
        description: row.details,
        createdAt: new Date(),
        appealAllowed: true,
      });
    }

    if (penalizations.length > 0) {
      await tx.insert(penalization).values(penalizations);
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

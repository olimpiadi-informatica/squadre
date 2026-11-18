import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

import { cache } from "react";

import { and, eq, exists, inArray, isNotNull, min, sql } from "drizzle-orm";
import { flatMapAsync } from "es-toolkit";
import { isString } from "es-toolkit/compat";
import Papa from "papaparse";

import { db } from "./db";
import {
  institute,
  institutePenalization,
  type PenalizationLevel,
  type PenalizationType,
  penalization,
  round,
  submission,
  task,
  team,
  teamRound,
  teamRoundPenalization,
} from "./db/schema";

const yellowAppealPolicy: Record<PenalizationType, boolean> = {
  // I controlli internet sono appellabili; le penalità manuali per le
  // registrazioni mancanti impostano `appealAllowed: false` esplicitamente.
  proctoring: true,
  plagiarism: true,
  ai: true,
  other: false,
};

export function isPenalizationAppealable(level: PenalizationLevel, type: PenalizationType) {
  return level === "yellow" && yellowAppealPolicy[type];
}

export type RoundPenalization = {
  id: number;
  teams: string;
  instituteId: string | null;
  instituteName: string | null;
  instituteCity: string | null;
  roundSlug: string;
  editionId: string;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
  createdAt: Date;
  appealAllowed: boolean;
  sentAt: Date | null;
  allowAppealUntil: Date | null;
  appealApproved: boolean | null;
};

export function listRoundPenalization(
  editionId: string,
  roundSlug: string,
): Promise<RoundPenalization[]> {
  return db
    .select({
      id: penalization.id,
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      instituteId: min(institute.id),
      instituteName: min(institute.name),
      instituteCity: min(institute.city),
      roundSlug: round.slug,
      editionId: round.editionId,
      level: penalization.level,
      type: penalization.type,
      description: penalization.description,
      createdAt: penalization.createdAt,
      appealAllowed: penalization.appealAllowed,
      sentAt: penalization.sentAt,
      allowAppealUntil: penalization.allowAppealUntil,
      appealApproved: penalization.appealApproved,
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
      penalization.allowAppealUntil,
      round.slug,
      round.editionId,
    )
    .orderBy((t) => [t.instituteName, t.instituteCity, t.type, t.teams]);
}

export type RoundPenalizationDetail = {
  id: number;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
  createdAt: Date;
  appealAllowed: boolean;
  sentAt: Date | null;
  allowAppealUntil: Date | null;
  appealApproved: boolean | null;
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
      sentAt: penalization.sentAt,
      allowAppealUntil: penalization.allowAppealUntil,
      appealApproved: penalization.appealApproved,
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
      penalization.allowAppealUntil,
    );
  return item;
}

export type InstitutePenalizationAccess = {
  token: string;
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  roundId: number;
  roundSlug: string;
  roundTitle: string;
  editionId: string;
};

export const getInstitutePenalizationAccess = cache(
  async (token: string): Promise<InstitutePenalizationAccess | undefined> => {
    const [access] = await db
      .select({
        token: institutePenalization.token,
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCity: institute.city,
        roundId: round.id,
        roundSlug: round.slug,
        roundTitle: round.title,
        editionId: round.editionId,
      })
      .from(institutePenalization)
      .innerJoin(institute, eq(institute.id, institutePenalization.instituteId))
      .innerJoin(round, eq(round.id, institutePenalization.roundId))
      .where(eq(institutePenalization.token, token));
    return access;
  },
);

export function listInstitutePenalizations(token: string): Promise<RoundPenalization[]> {
  return db
    .select({
      id: penalization.id,
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      instituteId: min(institute.id),
      instituteName: min(institute.name),
      instituteCity: min(institute.city),
      roundSlug: round.slug,
      editionId: round.editionId,
      level: penalization.level,
      type: penalization.type,
      description: penalization.description,
      createdAt: penalization.createdAt,
      appealAllowed: penalization.appealAllowed,
      sentAt: penalization.sentAt,
      allowAppealUntil: penalization.allowAppealUntil,
      appealApproved: penalization.appealApproved,
    })
    .from(institutePenalization)
    .innerJoin(round, eq(round.id, institutePenalization.roundId))
    .innerJoin(teamRound, eq(teamRound.roundId, round.id))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.teamRoundId, teamRound.id))
    .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
    .where(
      and(
        eq(institutePenalization.token, token),
        eq(team.instituteId, institutePenalization.instituteId),
        isNotNull(penalization.sentAt),
      ),
    )
    .groupBy(penalization.id, round.slug, round.editionId)
    .orderBy(penalization.id);
}

export async function getInstitutePenalization(
  token: string,
  penalizationId: number,
): Promise<RoundPenalizationDetail | undefined> {
  const access = await getInstitutePenalizationAccess(token);
  if (!access) return undefined;

  const item = await getRoundPenalization(access.roundId, penalizationId);
  if (!item?.sentAt) return undefined;

  const [owned] = await db
    .select({ id: penalization.id })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .where(
      and(
        eq(penalization.id, penalizationId),
        eq(teamRound.roundId, access.roundId),
        eq(team.instituteId, access.instituteId),
      ),
    );
  return owned ? item : undefined;
}

export async function reviewPenalizationAppeal(
  roundId: number,
  penalizationId: number,
  approved: boolean,
) {
  const [updated] = await db
    .update(penalization)
    .set({
      appealApproved: approved,
      ...(approved
        ? { level: "yellow" as const, appealAllowed: true }
        : { level: "red" as const, appealAllowed: false }),
    })
    .where(
      and(
        eq(penalization.id, penalizationId),
        exists(
          db
            .select({ id: teamRoundPenalization.id })
            .from(teamRoundPenalization)
            .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
            .where(
              and(
                eq(teamRoundPenalization.penalizationId, penalization.id),
                eq(teamRound.roundId, roundId),
              ),
            ),
        ),
      ),
    )
    .returning({ id: penalization.id });
  if (!updated) throw new Error("Penalizzazione non trovata.");
}

export * from "./penalization-status";

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
          appealAllowed: isPenalizationAppealable("yellow", "plagiarism"),
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

/**
 * Importa le penalità proctoring da un CSV di squadre sospette (formato
 * `Token,Reasons`). Il livello di default è giallo; se sono presenti anche
 * colonne `level`/`appeal` le rispetta.
 */
export async function importRoundProctoringPenalization(
  editionId: string,
  roundSlug: string,
  files: FormDataEntryValue[],
) {
  const rows = await flatMapAsync(files, parseProctoringCsv);
  if (rows.length === 0) {
    throw new Error("Il CSV non contiene righe valide.");
  }

  await db.transaction(async (tx) => {
    const teams = await tx
      .select({
        teamSlug: team.slug,
        teamRoundId: teamRound.id,
      })
      .from(teamRound)
      .innerJoin(team, eq(team.id, teamRound.teamId))
      .innerJoin(round, eq(round.id, teamRound.roundId))
      .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)));

    const bySlug = new Map(teams.map((item) => [item.teamSlug, item] as const));

    for (const row of rows) {
      const target = bySlug.get(row.teamSlug);
      if (!target) {
        throw new Error(`Squadra ${row.teamSlug} non trovata nel round.`);
      }

      const [existing] = await tx
        .select({ id: penalization.id })
        .from(penalization)
        .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
        .where(
          and(
            eq(teamRoundPenalization.teamRoundId, target.teamRoundId),
            eq(penalization.type, "proctoring"),
            eq(penalization.description, row.description),
          ),
        )
        .limit(1);

      if (existing) continue;

      const [{ id }] = await tx
        .insert(penalization)
        .values({
          level: row.level,
          type: "proctoring",
          description: row.description,
          createdAt: new Date(),
          appealAllowed: row.appealAllowed,
        })
        .returning({ id: penalization.id });

      await tx.insert(teamRoundPenalization).values({
        penalizationId: id,
        teamRoundId: target.teamRoundId,
      });
    }
  });
}

type ProctoringCsvRow = {
  teamSlug: string;
  level: PenalizationLevel;
  description: string;
  appealAllowed: boolean;
};

async function parseProctoringCsv(file: FormDataEntryValue): Promise<ProctoringCsvRow[]> {
  const source = isString(file) ? file : Readable.fromWeb(file.stream() as ReadableStream);

  const rows = await new Promise<string[][]>((resolve, reject) => {
    Papa.parse(source, {
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

  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = header.some((cell) =>
    [
      "token",
      "username",
      "team",
      "slug",
      "squadra",
      "level",
      "color",
      "livello",
      "colore",
      "reasons",
      "reason",
      "description",
      "motivation",
      "descrizione",
      "motivazione",
      "appeal",
      "appellabile",
    ].includes(cell),
  );
  const indexOf = (...names: string[]) => header.findIndex((cell) => names.includes(cell));

  const teamIndex = hasHeader ? indexOf("token", "username", "team", "slug", "squadra") : 0;
  const levelIndex = hasHeader ? indexOf("level", "color", "livello", "colore") : -1;
  const descriptionIndex = hasHeader
    ? indexOf("reasons", "reason", "description", "motivation", "descrizione", "motivazione")
    : 1;
  const appealIndex = hasHeader ? indexOf("appeal", "appellabile") : -1;

  return (hasHeader ? rows.slice(1) : rows).map((columns, index) => {
    const line = index + (hasHeader ? 2 : 1);
    const teamSlug = teamIndex >= 0 ? columns[teamIndex]?.trim() : "";
    if (!teamSlug) {
      throw new Error(`Riga ${line}: token/username mancante.`);
    }

    const levelRaw = levelIndex >= 0 ? columns[levelIndex]?.trim().toLowerCase() : "";
    const level: PenalizationLevel = levelRaw === "rosso" || levelRaw === "red" ? "red" : "yellow";
    const description =
      (descriptionIndex >= 0 ? columns[descriptionIndex]?.trim() : "") || "proctoring";
    const appealRaw = appealIndex >= 0 ? columns[appealIndex]?.trim().toLowerCase() : "";
    const appealAllowed =
      level === "yellow" &&
      (appealRaw
        ? ["true", "1", "yes", "si", "sì"].includes(appealRaw)
        : !/screenrecording|registrazione/i.test(description));

    return { teamSlug, level, description, appealAllowed };
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

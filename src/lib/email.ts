import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import {
  and,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  lte,
  min,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import nodemailer from "nodemailer";
import type StreamTransport from "nodemailer/lib/stream-transport";

import {
  getRoundStartForTeam,
  isCredentialsEmailClosed,
  isPenalizationEmailClosed,
} from "~/lib/round-config";
import { listRoundTeamsCredentials } from "~/lib/team";

import { db } from "./db";
import { penalizedRound, penalizedTeamRound } from "./db/aliases";
import {
  credentialEmail,
  email as emailTable,
  institute,
  institutePenalization,
  type PenalizationLevel,
  type PenalizationType,
  penalization,
  penalizationEmail,
  penalizationEmailItem,
  round,
  team,
  teamRound,
  teamRoundPenalization,
} from "./db/schema";
import type { EditionAdminItem } from "./edition";
import {
  getEmailTemplateContent,
  PASSWORD_EMAIL_TEMPLATE_ID,
  PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID,
  PENALIZATION_EMAIL_TEMPLATE_ID,
  renderPasswordEmail,
  renderPenalizationAppealResultEmail,
  renderPenalizationEmail,
} from "./email-template";
import type { RoundAdminItem } from "./round";

export type RoundEmailStatus = "not-sent" | "sending" | "sent" | "sending-failed";

export type RoundEmail = {
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  address: string | null;
  status: RoundEmailStatus;
  emailId: number | null;
};

export type RoundPenalizationEmailRecord = {
  emailId: number;
  address: string;
  status: RoundEmailStatus;
  createdAt: Date;
  penalizationCount: number;
};

export type RoundPenalizationEmailPenalization = {
  id: number;
  teams: string;
  level: PenalizationLevel;
  type: PenalizationType;
  description: string;
  /** Inclusa in un'email già inviata a questo istituto. */
  sent: boolean;
};

export type RoundPenalizationEmailGroup = {
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  address: string | null;
  /** Penalizzazioni del round che riguardano l'istituto. */
  penalizationCount: number;
  /** Penalizzazioni non ancora incluse in un'email inviata all'istituto. */
  pendingCount: number;
  yellowCount: number;
  redCount: number;
  pendingYellowCount: number;
  pendingRedCount: number;
  penalizations: RoundPenalizationEmailPenalization[];
  /** Email inviate all'istituto, dalla più recente. */
  emails: RoundPenalizationEmailRecord[];
};

export function listRoundEmailStatuses(
  editionId: string,
  roundSlug: string,
): Promise<RoundEmail[]> {
  return db
    .select({
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      address: sql<string | null>`COALESCE(${emailTable.address}, ${institute.email})`,
      status: sql<RoundEmailStatus>`COALESCE(${emailTable.status}, 'not-sent')`,
      emailId: emailTable.id,
    })
    .from(institute)
    .crossJoin(round)
    .leftJoin(
      credentialEmail,
      and(eq(credentialEmail.instituteId, institute.id), eq(credentialEmail.roundId, round.id)),
    )
    .leftJoin(emailTable, eq(emailTable.id, credentialEmail.emailId))
    .where(
      and(
        exists(
          db
            .select({ id: team.id })
            .from(team)
            .where(
              and(
                eq(team.instituteId, institute.id),
                eq(team.editionId, round.editionId),
                eq(team.finalist, true).if(roundSlug === "final"),
                notExists(
                  db
                    .select({ id: penalizedTeamRound.id })
                    .from(penalizedTeamRound)
                    .innerJoin(penalizedRound, eq(penalizedRound.id, penalizedTeamRound.roundId))
                    .innerJoin(
                      teamRoundPenalization,
                      eq(teamRoundPenalization.teamRoundId, penalizedTeamRound.id),
                    )
                    .innerJoin(
                      penalization,
                      eq(penalization.id, teamRoundPenalization.penalizationId),
                    )
                    .where(
                      and(
                        eq(penalizedTeamRound.teamId, team.id),
                        eq(penalization.level, "red"),
                        isNotNull(penalization.sentAt),
                        or(
                          isNull(penalization.appealApproved),
                          eq(penalization.appealApproved, false),
                        ),
                        lte(penalizedRound.startsAt, round.startsAt),
                      ),
                    ),
                ),
              ),
            ),
        ),
        eq(round.editionId, editionId),
        eq(round.slug, roundSlug),
      ),
    );
}

export async function listRoundPenalizationEmailGroups(
  editionId: string,
  roundSlug: string,
): Promise<RoundPenalizationEmailGroup[]> {
  // Penalizzazioni già comunicate a un istituto: `sent_at` da solo non basta,
  // perché una stessa penalizzazione può coinvolgere squadre di scuole diverse.
  const emailedPenalization = db
    .select({
      instituteId: institutePenalization.instituteId,
      roundId: institutePenalization.roundId,
      penalizationId: penalizationEmailItem.penalizationId,
    })
    .from(penalizationEmailItem)
    .innerJoin(
      penalizationEmail,
      eq(penalizationEmail.id, penalizationEmailItem.penalizationEmailId),
    )
    .innerJoin(
      institutePenalization,
      eq(institutePenalization.id, penalizationEmail.institutePenalizationId),
    )
    .groupBy(
      institutePenalization.instituteId,
      institutePenalization.roundId,
      penalizationEmailItem.penalizationId,
    )
    .as("emailed_penalization");

  const groups = await db
    .select({
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCity: institute.city,
      address: institute.email,
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .groupBy(institute.id, institute.name, institute.city, institute.email)
    .orderBy(institute.name, institute.city);

  const penalizationRows = await db
    .select({
      instituteId: institute.id,
      id: penalization.id,
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      level: penalization.level,
      type: penalization.type,
      description: penalization.description,
      sent: sql<boolean>`BOOL_OR(${emailedPenalization.penalizationId} IS NOT NULL)`,
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .leftJoin(
      emailedPenalization,
      and(
        eq(emailedPenalization.instituteId, institute.id),
        eq(emailedPenalization.roundId, round.id),
        eq(emailedPenalization.penalizationId, penalization.id),
      ),
    )
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .groupBy(
      institute.id,
      penalization.id,
      penalization.level,
      penalization.type,
      penalization.description,
    )
    .orderBy(
      institute.name,
      institute.city,
      penalization.level,
      penalization.type,
      penalization.id,
    );

  const emailRows = await db
    .select({
      instituteId: institutePenalization.instituteId,
      emailId: emailTable.id,
      address: emailTable.address,
      status: emailTable.status,
      createdAt: emailTable.createdAt,
      penalizationCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${penalizationEmailItem}
        WHERE ${penalizationEmailItem.penalizationEmailId} = ${penalizationEmail.id}
      )`,
    })
    .from(penalizationEmail)
    .innerJoin(
      institutePenalization,
      eq(institutePenalization.id, penalizationEmail.institutePenalizationId),
    )
    .innerJoin(round, eq(round.id, institutePenalization.roundId))
    .innerJoin(emailTable, eq(emailTable.id, penalizationEmail.emailId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .orderBy(desc(emailTable.createdAt), desc(emailTable.id));

  const emailsByInstitute = new Map<string, RoundPenalizationEmailRecord[]>();
  for (const row of emailRows) {
    const emails = emailsByInstitute.get(row.instituteId) ?? [];
    emails.push(row);
    emailsByInstitute.set(row.instituteId, emails);
  }

  const penalizationsByInstitute = new Map<string, RoundPenalizationEmailPenalization[]>();
  for (const row of penalizationRows) {
    const penalizations = penalizationsByInstitute.get(row.instituteId) ?? [];
    penalizations.push(row);
    penalizationsByInstitute.set(row.instituteId, penalizations);
  }

  return groups.map((group) => {
    const penalizations = penalizationsByInstitute.get(group.instituteId) ?? [];
    const pending = penalizations.filter((penalization) => !penalization.sent);
    return {
      ...group,
      penalizationCount: penalizations.length,
      pendingCount: pending.length,
      yellowCount: penalizations.filter((penalization) => penalization.level === "yellow").length,
      redCount: penalizations.filter((penalization) => penalization.level === "red").length,
      pendingYellowCount: pending.filter((penalization) => penalization.level === "yellow").length,
      pendingRedCount: pending.filter((penalization) => penalization.level === "red").length,
      penalizations,
      emails: emailsByInstitute.get(group.instituteId) ?? [],
    };
  });
}

function createTransporter() {
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  return nodemailer.createTransport({
    streamTransport: true,
  });
}

export const CREDENTIALS_EMAIL_CLOSED_MESSAGE =
  "L'invio delle email con le credenziali è chiuso: sono trascorsi più di 1 giorno dalla fine del round.";
export const PENALIZATION_EMAIL_CLOSED_MESSAGE =
  "L'invio delle email di penalizzazione è chiuso: sono trascorsi più di 3 mesi dalla fine del round.";

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
};

async function sendMail({ to, subject, html, cc }: SendMailOptions) {
  const transporter = createTransporter();

  const messageInfo = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc,
    subject,
    html,
  });

  if (process.env.NODE_ENV !== "production") {
    const message = (messageInfo as StreamTransport.SentMessageInfo).message;
    if (message) {
      const dir = path.join("emails", to);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${Date.now()}.eml`), message);
    }
  }

  return messageInfo;
}

export async function sendInstituteEmail(
  edition: EditionAdminItem,
  round: RoundAdminItem,
  instituteId: string,
) {
  if (isCredentialsEmailClosed(round.endsAt)) {
    throw new Error(CREDENTIALS_EMAIL_CLOSED_MESSAGE);
  }

  const teamsData = await listRoundTeamsCredentials(edition.id, round.slug, undefined, instituteId);
  if (teamsData.length === 0) throw new Error(`No teams found for institute ${instituteId}`);

  const address = teamsData[0].instituteEmail;
  if (!address) throw new Error(`Institute ${instituteId} has no email address`);
  const template = (await getEmailTemplateContent(PASSWORD_EMAIL_TEMPLATE_ID)) ?? "";

  const [credential] = await db.transaction(async (tx) => {
    const [emailRecord] = await tx
      .insert(emailTable)
      .values({
        address,
        status: "sending",
      })
      .returning({ id: emailTable.id });

    return tx
      .insert(credentialEmail)
      .values({
        instituteId,
        roundId: round.id,
        emailId: emailRecord.id,
      })
      .returning({
        id: credentialEmail.id,
        token: credentialEmail.token,
        emailId: credentialEmail.emailId,
      });
  });

  try {
    const coach = teamsData[0].coach;
    const delay = teamsData[0].delay;
    const start = getRoundStartForTeam(round.startsAt, round.slug, delay);
    const startTime = format(new TZDate(start, "Europe/Rome"), "HH:mm");

    const credentialsPdfUrl = `https://squadre-staging.olinfo.it/teacher/c/${encodeURIComponent(credential.token)}/credenziali-round-${encodeURIComponent(round.slug)}.pdf`;
    const html = await renderPasswordEmail(
      coach,
      round.title,
      edition.year,
      teamsData,
      startTime,
      credentialsPdfUrl,
      template,
    );
    await db.update(emailTable).set({ html }).where(eq(emailTable.id, credential.emailId));

    await sendMail({
      to: address,
      subject: `Password OIS ${round.title} - Edizione ${edition.year}`,
      html,
    });

    await db
      .update(emailTable)
      .set({ status: "sent" })
      .where(eq(emailTable.id, credential.emailId));
  } catch (err) {
    console.error(err);
    await db
      .update(emailTable)
      .set({ status: "sending-failed" })
      .where(eq(emailTable.id, credential.emailId));
  }
}

function getInstitutePendingPenalizations(roundId: number, instituteId: string) {
  return db
    .select({
      penalizationId: penalization.id,
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      type: penalization.type,
      level: penalization.level,
      description: penalization.description,
      coach: min(team.coach),
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .where(
      and(
        eq(team.instituteId, instituteId),
        eq(round.id, roundId),
        notExists(
          db
            .select({ id: penalizationEmailItem.id })
            .from(penalizationEmailItem)
            .innerJoin(
              penalizationEmail,
              eq(penalizationEmail.id, penalizationEmailItem.penalizationEmailId),
            )
            .innerJoin(
              institutePenalization,
              eq(institutePenalization.id, penalizationEmail.institutePenalizationId),
            )
            .where(
              and(
                eq(penalizationEmailItem.penalizationId, penalization.id),
                eq(institutePenalization.instituteId, instituteId),
                eq(institutePenalization.roundId, roundId),
              ),
            ),
        ),
      ),
    )
    .groupBy(penalization.id, penalization.type, penalization.level, penalization.description);
}

export async function sendInstitutePenalizationEmail(
  roundRecord: RoundAdminItem,
  instituteId: string,
) {
  if (isPenalizationEmailClosed(roundRecord.endsAt)) {
    throw new Error(PENALIZATION_EMAIL_CLOSED_MESSAGE);
  }

  // Get institute info
  const [instituteRow] = await db
    .select({ name: institute.name, email: institute.email, schoolEmail: institute.schoolEmail })
    .from(institute)
    .where(eq(institute.id, instituteId));
  if (!instituteRow) throw new Error(`Institute ${instituteId} not found`);

  const address = instituteRow.email;
  if (!address) throw new Error(`Institute ${instituteId} has no email address`);

  // Invia solo le penalizzazioni non ancora comunicate a questa scuola: se ne
  // vengono aggiunte altre in seguito, la scuola riceve una nuova email.
  const penalizationsData = await getInstitutePendingPenalizations(roundRecord.id, instituteId);

  if (penalizationsData.length === 0)
    throw new Error(`No new penalizations for institute ${instituteId}`);

  const coach = penalizationsData[0].coach ?? instituteRow.name;
  const template = (await getEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID)) ?? "";

  const penalizationRows = penalizationsData.map((p) => ({
    teams: p.teams,
    type: p.type,
    level: p.level,
    description: p.description,
  }));

  const { emailId, penalizationEmailId, token } = await db.transaction(async (tx) => {
    const [access] = await tx
      .insert(institutePenalization)
      .values({ instituteId, roundId: roundRecord.id })
      .onConflictDoUpdate({
        target: [institutePenalization.instituteId, institutePenalization.roundId],
        set: { instituteId },
      })
      .returning({ id: institutePenalization.id, token: institutePenalization.token });

    const [emailRecord] = await tx
      .insert(emailTable)
      .values({ address, status: "sending" })
      .returning({ id: emailTable.id });

    const [link] = await tx
      .insert(penalizationEmail)
      .values({
        institutePenalizationId: access.id,
        emailId: emailRecord.id,
      })
      .returning({ id: penalizationEmail.id });

    return { emailId: emailRecord.id, penalizationEmailId: link.id, token: access.token };
  });

  try {
    const detailsUrl = `https://squadre-staging.olinfo.it/teacher/p/${encodeURIComponent(token)}`;
    const html = await renderPenalizationEmail(coach, penalizationRows, detailsUrl, template);

    await db.update(emailTable).set({ html }).where(eq(emailTable.id, emailId));

    await sendMail({
      to: address,
      cc: [
        "ois@aldini.istruzioneer.it",
        ...(instituteRow.schoolEmail && penalizationsData.some((item) => item.level === "red")
          ? [instituteRow.schoolEmail]
          : []),
      ],
      subject: `Penalizzazioni OIS ${roundRecord.title}`,
      html,
    });

    const penalizationIds = penalizationsData.map((p) => p.penalizationId);
    await db.transaction(async (tx) => {
      await tx.update(emailTable).set({ status: "sent" }).where(eq(emailTable.id, emailId));
      await tx
        .insert(penalizationEmailItem)
        .values(penalizationIds.map((penalizationId) => ({ penalizationEmailId, penalizationId })))
        .onConflictDoNothing();
      await tx
        .update(penalization)
        .set({
          sentAt: sql`COALESCE(${penalization.sentAt}, NOW())`,
          allowAppealUntil: sql`COALESCE(${penalization.allowAppealUntil}, NOW() + INTERVAL '5 days')`,
        })
        .where(inArray(penalization.id, penalizationIds));
    });
  } catch (err) {
    console.error(err);
    await db.update(emailTable).set({ status: "sending-failed" }).where(eq(emailTable.id, emailId));
  }
}

export async function getInstitutePenalizationEmailPreview(
  roundRecord: RoundAdminItem,
  instituteId: string,
): Promise<string | null> {
  const [instituteRow] = await db
    .select({ name: institute.name, email: institute.email })
    .from(institute)
    .where(eq(institute.id, instituteId));
  if (!instituteRow) return null;

  const penalizationsData = await getInstitutePendingPenalizations(roundRecord.id, instituteId);
  if (penalizationsData.length === 0) return null;

  const [access] = await db
    .select({ token: institutePenalization.token })
    .from(institutePenalization)
    .where(
      and(
        eq(institutePenalization.instituteId, instituteId),
        eq(institutePenalization.roundId, roundRecord.id),
      ),
    );

  const coach = penalizationsData[0].coach ?? instituteRow.name;
  const template = (await getEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID)) ?? "";
  const detailsUrl = access
    ? `https://squadre-staging.olinfo.it/teacher/p/${encodeURIComponent(access.token)}`
    : "#";

  return renderPenalizationEmail(
    coach,
    penalizationsData.map((p) => ({
      teams: p.teams,
      type: p.type,
      level: p.level,
      description: p.description,
    })),
    detailsUrl,
    template,
  );
}

export async function sendPenalizationAppealResultEmail(
  roundRecord: RoundAdminItem,
  penalizationId: number,
  approved: boolean,
) {
  const recipients = await db
    .select({
      instituteId: institute.id,
      address: institute.email,
      schoolEmail: institute.schoolEmail,
      coach: min(team.coach),
      teams: sql<string>`STRING_AGG(${team.slug}, ', ' ORDER BY ${team.slug})`,
      token: institutePenalization.token,
    })
    .from(penalization)
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .innerJoin(institute, eq(institute.id, team.instituteId))
    .innerJoin(
      institutePenalization,
      and(
        eq(institutePenalization.instituteId, institute.id),
        eq(institutePenalization.roundId, roundRecord.id),
      ),
    )
    .where(and(eq(penalization.id, penalizationId), eq(teamRound.roundId, roundRecord.id)))
    .groupBy(institute.id, institute.email, institute.schoolEmail, institutePenalization.token);

  if (recipients.length === 0) throw new Error("Nessun destinatario trovato per il ricorso.");

  const template =
    (await getEmailTemplateContent(PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID)) ?? "";

  for (const recipient of recipients) {
    if (!recipient.address) {
      throw new Error(`L'istituto ${recipient.instituteId} non ha un indirizzo email.`);
    }

    const detailsUrl = `https://squadre-staging.olinfo.it/teacher/p/${encodeURIComponent(recipient.token)}`;
    const html = await renderPenalizationAppealResultEmail(
      recipient.coach ?? recipient.instituteId,
      recipient.teams,
      approved,
      detailsUrl,
      template,
    );
    const [emailRecord] = await db
      .insert(emailTable)
      .values({ address: recipient.address, status: "sending", html })
      .returning({ id: emailTable.id });

    try {
      await sendMail({
        to: recipient.address,
        cc: !approved && recipient.schoolEmail ? recipient.schoolEmail : undefined,
        subject: `Esito ricorso OIS ${roundRecord.title}`,
        html,
      });
      await db.update(emailTable).set({ status: "sent" }).where(eq(emailTable.id, emailRecord.id));
    } catch (err) {
      await db
        .update(emailTable)
        .set({ status: "sending-failed" })
        .where(eq(emailTable.id, emailRecord.id));
      throw err;
    }
  }
}

export async function getInstituteEmailHtml(emailId: number): Promise<string | null> {
  const [row] = await db
    .select({ html: emailTable.html })
    .from(emailTable)
    .where(eq(emailTable.id, emailId));
  return row?.html ?? null;
}

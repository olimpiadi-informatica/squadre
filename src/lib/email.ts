import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import {
  and,
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

import { getRoundStartForTeam } from "~/lib/round-config";
import { listRoundTeamsCredentials } from "~/lib/team";

import { db } from "./db";
import {
  credentialEmail,
  email as emailTable,
  institute,
  institutePenalization,
  penalization,
  penalizationEmail,
  penalizedRound,
  penalizedTeamRound,
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

export type RoundPenalizationEmail = {
  instituteId: string;
  instituteName: string;
  instituteCity: string;
  address: string | null;
  status: RoundEmailStatus;
  emailId: number | null;
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

export function listRoundPenalizationEmailStatuses(
  editionId: string,
  roundSlug: string,
): Promise<RoundPenalizationEmail[]> {
  const latestEmail = db
    .select({
      institutePenalizationId: penalizationEmail.institutePenalizationId,
      emailId: sql<number>`MAX(${penalizationEmail.emailId})`.as("email_id"),
    })
    .from(penalizationEmail)
    .groupBy(penalizationEmail.institutePenalizationId)
    .as("latest_penalization_email");

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
    .innerJoin(team, eq(team.instituteId, institute.id))
    .innerJoin(teamRound, eq(teamRound.teamId, team.id))
    .innerJoin(round, eq(round.id, teamRound.roundId))
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.teamRoundId, teamRound.id))
    .innerJoin(penalization, eq(penalization.id, teamRoundPenalization.penalizationId))
    .leftJoin(
      institutePenalization,
      and(
        eq(institutePenalization.instituteId, institute.id),
        eq(institutePenalization.roundId, round.id),
      ),
    )
    .leftJoin(latestEmail, eq(latestEmail.institutePenalizationId, institutePenalization.id))
    .leftJoin(emailTable, eq(emailTable.id, latestEmail.emailId))
    .where(and(eq(round.editionId, editionId), eq(round.slug, roundSlug)))
    .groupBy(
      institute.id,
      institute.name,
      institute.city,
      institute.email,
      emailTable.id,
      emailTable.address,
      emailTable.status,
    );
}

const EMAIL_FROM = "Olimpiadi di Informatica a Squadre <ois@olimpiadi-scientifiche.it>";
const EMAIL_REPLY_TO = "info@olimpiadi-scientifiche.it";

function createTransporter() {
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  return nodemailer.createTransport({
    streamTransport: true,
  });
}

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
};

async function sendMail({ to, subject, html, cc }: SendMailOptions) {
  const transporter = createTransporter();

  const messageInfo = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    replyTo: EMAIL_REPLY_TO,
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

    const credentialsPdfUrl = `https://squadre.olinfo.it/teacher/c/${encodeURIComponent(credential.token)}/credenziali-round-${encodeURIComponent(round.slug)}.pdf`;
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

export async function sendInstitutePenalizationEmail(
  roundRecord: RoundAdminItem,
  instituteId: string,
) {
  // Get institute info
  const [instituteRow] = await db
    .select({ name: institute.name, email: institute.email, schoolEmail: institute.schoolEmail })
    .from(institute)
    .where(eq(institute.id, instituteId));
  if (!instituteRow) throw new Error(`Institute ${instituteId} not found`);

  const address = instituteRow.email;
  if (!address) throw new Error(`Institute ${instituteId} has no email address`);

  // Get all penalizations for this institute in this round, grouped by penalization id
  const penalizationsData = await db
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
    .where(and(eq(team.instituteId, instituteId), eq(round.id, roundRecord.id)))
    .groupBy(penalization.id, penalization.type, penalization.level, penalization.description);

  if (penalizationsData.length === 0)
    throw new Error(`No penalizations for institute ${instituteId}`);

  const coach = penalizationsData[0].coach ?? instituteRow.name;
  const template = (await getEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID)) ?? "";

  const penalizationRows = penalizationsData.map((p) => ({
    teams: p.teams,
    type: p.type,
    level: p.level,
    description: p.description,
  }));

  const { emailId, token } = await db.transaction(async (tx) => {
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

    await tx.insert(penalizationEmail).values({
      institutePenalizationId: access.id,
      emailId: emailRecord.id,
    });

    return { emailId: emailRecord.id, token: access.token };
  });

  try {
    const detailsUrl = `https://squadre.olinfo.it/teacher/p/${encodeURIComponent(token)}`;
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

    const detailsUrl = `https://squadre.olinfo.it/teacher/p/${encodeURIComponent(recipient.token)}`;
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

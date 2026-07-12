import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { and, eq, exists, inArray, min, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import type StreamTransport from "nodemailer/lib/stream-transport";

import { getRoundStartForTeam } from "~/lib/round-config";
import { listRoundTeamsCredentials } from "~/lib/team";

import { db } from "./db";
import {
  credentialEmail,
  email as emailTable,
  institute,
  penalization,
  penalizationEmail,
  round,
  team,
  teamRound,
  teamRoundPenalization,
} from "./db/schema";
import type { EditionAdminItem } from "./edition";
import {
  getEmailTemplateContent,
  PASSWORD_EMAIL_TEMPLATE_ID,
  PENALIZATION_EMAIL_TEMPLATE_ID,
  renderPasswordEmail,
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
            .where(and(eq(team.instituteId, institute.id), eq(team.editionId, round.editionId))),
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
      penalizationEmail,
      and(eq(penalizationEmail.instituteId, institute.id), eq(penalizationEmail.roundId, round.id)),
    )
    .leftJoin(emailTable, eq(emailTable.id, penalizationEmail.emailId))
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

function createTransporter() {
  return nodemailer.createTransport({
    streamTransport: true,
  });
  /* return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 1025),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  }); */
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

    const transporter = createTransporter();
    const messageInfo = await transporter.sendMail({
      from: "Olimpiadi di Informatica a Squadre <ois@olimpiadi-scientifiche.it>",
      to: address,
      replyTo: "ois@aldini.istruzioneer.it",
      subject: `Password OIS ${round.title} - Edizione ${edition.year}`,
      html,
    });
    const message = (messageInfo as StreamTransport.SentMessageInfo).message;

    const dir = path.join("emails", address);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${Date.now()}.eml`), message);

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
    .select({ name: institute.name, email: institute.email })
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

  const emailId = await db.transaction(async (tx) => {
    const [emailRecord] = await tx
      .insert(emailTable)
      .values({ address, status: "sending" })
      .returning({ id: emailTable.id });

    const [penEmailRecord] = await tx
      .insert(penalizationEmail)
      .values({
        instituteId,
        roundId: roundRecord.id,
        emailId: emailRecord.id,
      })
      .returning({ id: penalizationEmail.id });

    // Update all penalizations of this institute in this round
    const penalizationIds = penalizationsData.map((p) => p.penalizationId);
    await tx
      .update(penalization)
      .set({ penalizationEmailId: penEmailRecord.id })
      .where(inArray(penalization.id, penalizationIds));

    return emailRecord.id;
  });

  try {
    const detailsUrl = `https://squadre.olinfo.it/admin/edition/${roundRecord.editionId}/round/${roundRecord.slug}/penalization`;
    const html = await renderPenalizationEmail(coach, penalizationRows, detailsUrl, template);

    await db.update(emailTable).set({ html }).where(eq(emailTable.id, emailId));

    const transporter = createTransporter();
    const messageInfo = await transporter.sendMail({
      from: "Olimpiadi di Informatica a Squadre <ois@olimpiadi-scientifiche.it>",
      to: address,
      cc: "ois@aldini.istruzioneer.it",
      subject: `Penalizzazioni OIS ${roundRecord.title}`,
      html,
    });
    const message = (messageInfo as StreamTransport.SentMessageInfo).message;

    const dir = path.join("emails", address);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${Date.now()}.eml`), message);

    await db.update(emailTable).set({ status: "sent" }).where(eq(emailTable.id, emailId));
  } catch (err) {
    console.error(err);
    await db.update(emailTable).set({ status: "sending-failed" }).where(eq(emailTable.id, emailId));
  }
}

export async function getInstituteEmailHtml(emailId: number): Promise<string | null> {
  const [row] = await db
    .select({ html: emailTable.html })
    .from(emailTable)
    .where(eq(emailTable.id, emailId));
  return row?.html ?? null;
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { and, eq, exists, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import type StreamTransport from "nodemailer/lib/stream-transport";

import { getRoundStartForTeam } from "~/lib/round-config";
import { listRoundTeamsCredentials } from "~/lib/team";

import { db } from "./db";
import { credentialEmail, email as emailTable, institute, round, team } from "./db/schema";
import type { EditionAdminItem } from "./edition";
import {
  getEmailTemplateContent,
  PASSWORD_EMAIL_TEMPLATE_ID,
  renderPasswordEmail,
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

export async function getInstituteEmailHtml(emailId: number): Promise<string | null> {
  const [row] = await db
    .select({ html: emailTable.html })
    .from(emailTable)
    .where(eq(emailTable.id, emailId));
  return row?.html ?? null;
}

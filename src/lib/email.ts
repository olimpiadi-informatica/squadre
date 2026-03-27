import { TZDate } from "@date-fns/tz";
import { addSeconds, format, subMinutes } from "date-fns";
import { and, eq, exists, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

import { listRoundTeamsCredentials } from "~/lib/team";

import { db } from "./db";
import { institute, roundEmail, team, teamRound } from "./db/schema";
import type { EditionAdminItem } from "./edition";
import { renderPasswordEmail } from "./email-template";
import type { RoundAdminItem } from "./round";

export type RoundEmailStatus = "not-sent" | "sending" | "sent" | "sending-failed";

export type RoundEmail = {
  instituteId: string;
  instituteName: string;
  address: string | null;
  status: RoundEmailStatus;
};

export function listRoundEmailStatuses(editionId: string, roundId: string): Promise<RoundEmail[]> {
  return db
    .selectDistinct({
      instituteId: institute.id,
      instituteName: institute.name,
      address: sql<string | null>`COALESCE(${roundEmail.address}, ${institute.email})`,
      status: sql<RoundEmailStatus>`COALESCE(${roundEmail.status}, 'not-sent')`,
    })
    .from(institute)
    .leftJoin(
      roundEmail,
      and(
        eq(roundEmail.instituteId, institute.id),
        eq(roundEmail.editionId, editionId),
        eq(roundEmail.roundId, roundId),
      ),
    )
    .where(
      and(
        eq(institute.id, team.instId),
        eq(team.editionId, editionId),
        eq(teamRound.roundId, roundId),
        exists(db.select().from(team).where(eq(team.instId, institute.id))),
      ),
    );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 1025),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

export async function sendInstituteEmail(
  edition: EditionAdminItem,
  round: RoundAdminItem,
  instituteId: string,
) {
  const teamsData = await listRoundTeamsCredentials(edition.id, round.id, undefined, instituteId);
  if (teamsData.length === 0) throw new Error(`No teams found for institute ${instituteId}`);

  const address = teamsData[0].instituteEmail;
  if (!address) throw new Error(`Institute ${instituteId} has no email address`);

  const [email] = await db
    .insert(roundEmail)
    .values({
      instituteId,
      editionId: edition.id,
      roundId: round.id,
      address,
      status: "sending",
    })
    .returning();

  try {
    const coach = teamsData[0].coach;
    const delay = teamsData[0].delay;
    const start = addSeconds(subMinutes(round.startsAt, 5), delay);
    const startTime = format(new TZDate(start, "Europe/Rome"), "HH:mm");

    const html = await renderPasswordEmail(coach, round.title, edition.name, teamsData, startTime);

    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Olimpiadi di Informatica a Squadre <ois@olimpiadi-scientifiche.it>",
      to: address,
      subject: `Password OIS ${round.title} - Edizione ${edition.name}`,
      html,
    });

    await db.update(roundEmail).set({ status: "sent" }).where(eq(roundEmail.id, email.id));
  } catch (err) {
    console.error(err);
    await db
      .update(roundEmail)
      .set({ status: "sending-failed" })
      .where(eq(roundEmail.id, email.id));
  }
}

import { TZDate } from "@date-fns/tz";
import { render } from "@react-email/components";
import { addSeconds, format, subMinutes } from "date-fns";
import { and, eq } from "drizzle-orm";
import nodemailer from "nodemailer";

import PasswordEmail from "~/emails/password-email";

import { db } from "./db";
import { institute, team, teamRound } from "./db/schema";
import type { EditionAdminItem } from "./edition";
import type { RoundAdminItem } from "./round";

export async function sendPasswordEmails(edition: EditionAdminItem, round: RoundAdminItem) {
  const teamsData = await db
    .select({
      teamName: team.name,
      isDebutant: team.junior,
      username: team.id,
      password: teamRound.password,
      delay: teamRound.delay,
      coach: team.coach,
      email: institute.email,
    })
    .from(teamRound)
    .innerJoin(team, and(eq(teamRound.teamId, team.id), eq(teamRound.editionId, team.editionId)))
    .innerJoin(institute, eq(team.instId, institute.id))
    .where(and(eq(teamRound.editionId, edition.id), eq(teamRound.roundId, round.id)));

  const byEmail = new Map<string, typeof teamsData>();
  for (const t of teamsData) {
    if (!t.email) continue;
    const group = byEmail.get(t.email) || [];
    group.push(t);
    byEmail.set(t.email, group);
  }

  const transporter = nodemailer.createTransport({
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

  const tourName = round.title;
  const editionName = edition.name;

  for (const [email, userTeams] of byEmail.entries()) {
    const referentName = userTeams[0].coach;
    const delay = userTeams[0].delay;
    const start = addSeconds(subMinutes(round.startsAt, 5), delay);
    const startTime = format(new TZDate(start, "Europe/Rome"), "HH:mm");

    const html = await render(
      <PasswordEmail
        referentName={referentName}
        tourName={tourName}
        editionName={editionName}
        teams={userTeams}
        startTime={startTime}
      />,
    );

    await transporter.sendMail({
      from: "Olimpiadi di Informatica a Squadre <ois@olimpiadi-scientifiche.it>",
      to: email,
      subject: `Password OIS ${tourName} -- Edizione ${editionName}`,
      html,
    });
  }
}

import type { NextRequest } from "next/server";

import { TZDate } from "@date-fns/tz";
import { addSeconds, format, subMinutes } from "date-fns";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import {
  getEmailTemplateContent,
  PASSWORD_EMAIL_TEMPLATE_ID,
  renderPasswordEmail,
} from "~/lib/email-template";
import { getRoundAdmin } from "~/lib/round";
import { listRoundTeamsCredentials } from "~/lib/team";

export async function GET(request: NextRequest) {
  await verifyAdmin();

  const editionId = request.nextUrl.searchParams.get("editionId");
  const roundId = request.nextUrl.searchParams.get("roundId");
  const instituteId = request.nextUrl.searchParams.get("instituteId");

  if (!editionId || !roundId || !instituteId) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);

  if (!edition) {
    return new Response("Edition not found", { status: 404 });
  }

  if (!round) {
    return new Response("Round not found", { status: 404 });
  }

  const teamsData = await listRoundTeamsCredentials(editionId, round.slug, undefined, instituteId);

  if (teamsData.length === 0) {
    return new Response("No teams found for institute", { status: 404 });
  }

  const coach = teamsData[0].coach;
  const delay = teamsData[0].delay;
  const start = addSeconds(subMinutes(round.startsAt, 5), delay);
  const startTime = format(new TZDate(start, "Europe/Rome"), "HH:mm");
  const template = (await getEmailTemplateContent(PASSWORD_EMAIL_TEMPLATE_ID)) ?? "";

  const html = await renderPasswordEmail(
    coach,
    round.title,
    edition.year,
    teamsData,
    startTime,
    "about:blank",
    template,
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

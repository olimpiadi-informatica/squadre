import { addDays, isPast } from "date-fns";
import { and, eq } from "drizzle-orm";
import { truncate } from "es-toolkit/compat";

import { db } from "~/lib/db";
import { credentialEmail, round } from "~/lib/db/schema";
import { createCredentialsPdf } from "~/lib/foglietti";
import { listRoundTeamsCredentials } from "~/lib/team";

type RouteContext = {
  params: Promise<{
    token: string;
    pdfName: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { token, pdfName } = await params;
  const roundMatch = /^credenziali-round-(\w+)\.pdf$/i.exec(pdfName);

  if (!roundMatch) {
    return new Response("Invalid file name", { status: 404 });
  }

  const roundId = roundMatch[1];

  const [email] = await db
    .select({
      instituteId: credentialEmail.instituteId,
      editionId: round.editionId,
      roundEndsAt: round.endsAt,
      roundTitle: round.title,
    })
    .from(credentialEmail)
    .innerJoin(round, eq(round.id, credentialEmail.roundId))
    .where(and(eq(round.slug, roundId), eq(credentialEmail.token, token)));

  if (!email) {
    return new Response("Invalid token", { status: 404 });
  }

  if (isPast(addDays(email.roundEndsAt, 1))) {
    return new Response("Token expired", { status: 404 });
  }

  const teamCredentials = await listRoundTeamsCredentials(
    email.editionId,
    roundId,
    undefined,
    email.instituteId,
  );
  if (teamCredentials.length === 0) {
    return new Response("No teams found for institute", { status: 404 });
  }

  const credentials = teamCredentials.map((t) => ({
    teamName: truncate(t.name, { length: 36 }),
    subtitle: email.roundTitle,
    username: t.slug,
    password: t.password,
  }));
  const pdf = await createCredentialsPdf(credentials);

  return new Response(pdf as Uint8Array<ArrayBuffer>, {
    headers: { "Content-Type": "application/pdf" },
  });
}

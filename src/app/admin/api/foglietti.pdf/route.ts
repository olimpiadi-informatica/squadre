import type { NextRequest } from "next/server";

import { truncate } from "es-toolkit/compat";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { createCredentialsPdf } from "~/lib/foglietti";
import { getRoundAdmin } from "~/lib/round";
import { listRoundTeamsCredentials } from "~/lib/team";

export async function GET(request: NextRequest) {
  await verifyAdmin();

  const editionId = request.nextUrl.searchParams.get("editionId");
  const roundId = request.nextUrl.searchParams.get("roundId");

  if (!editionId || !roundId) {
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

  const teamCredentials = await listRoundTeamsCredentials(editionId, round.slug);
  const credentials = teamCredentials.map((t) => ({
    teamName: truncate(t.name, { length: 36 }),
    subtitle: truncate(`${t.instituteName}, ${t.instituteCity}`, { length: 64 }),
    username: t.slug,
    password: t.password,
  }));
  const pdf = await createCredentialsPdf(credentials);

  return new Response(pdf as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="foglietti.pdf"',
    },
  });
}

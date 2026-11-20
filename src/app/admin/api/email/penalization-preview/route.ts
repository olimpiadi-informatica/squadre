import type { NextRequest } from "next/server";

import { verifyAdmin } from "~/lib/admin";
import { getInstitutePenalizationEmailPreview } from "~/lib/email";
import { getRoundAdmin } from "~/lib/round";

export async function GET(request: NextRequest) {
  await verifyAdmin();

  const editionId = request.nextUrl.searchParams.get("editionId");
  const roundId = request.nextUrl.searchParams.get("roundId");
  const instituteId = request.nextUrl.searchParams.get("instituteId");

  if (!editionId || !roundId || !instituteId) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const round = await getRoundAdmin(editionId, roundId);
  if (!round) {
    return new Response("Round not found", { status: 404 });
  }

  const html = await getInstitutePenalizationEmailPreview(round, instituteId);
  if (!html) {
    return new Response("No pending penalizations found for institute", { status: 404 });
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

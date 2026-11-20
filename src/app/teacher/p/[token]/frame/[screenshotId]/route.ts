import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "~/lib/db";
import {
  penalization,
  penalizationFrame,
  screenshot,
  team,
  teamRound,
  teamRoundPenalization,
} from "~/lib/db/schema";
import { getInstitutePenalizationAccess } from "~/lib/penalization";
import { readScreenshotFile } from "~/lib/screenshot";

type RouteContext = {
  params: Promise<{ token: string; screenshotId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { token, screenshotId } = await params;
  const id = Number.parseInt(screenshotId, 10);
  if (Number.isNaN(id)) {
    return new Response("Invalid screenshot id", { status: 400 });
  }

  const access = await getInstitutePenalizationAccess(token);
  if (!access) {
    return new Response("Screenshot not found", { status: 404 });
  }

  // Il token dà accesso alle penalizzazioni dell'istituto nel round: il frame
  // deve essere allegato a una di quelle e la penalizzazione deve essere già
  // stata inviata all'istituto.
  const [owned] = await db
    .select({ id: screenshot.id })
    .from(screenshot)
    .innerJoin(penalizationFrame, eq(penalizationFrame.screenshotId, screenshot.id))
    .innerJoin(penalization, eq(penalization.id, penalizationFrame.penalizationId))
    .innerJoin(teamRoundPenalization, eq(teamRoundPenalization.penalizationId, penalization.id))
    .innerJoin(teamRound, eq(teamRound.id, teamRoundPenalization.teamRoundId))
    .innerJoin(team, eq(team.id, teamRound.teamId))
    .where(
      and(
        eq(screenshot.id, id),
        eq(team.instituteId, access.instituteId),
        eq(teamRound.roundId, access.roundId),
        isNotNull(penalization.sentAt),
      ),
    )
    .limit(1);

  if (!owned) {
    return new Response("Screenshot not found", { status: 404 });
  }

  const file = await readScreenshotFile(id);
  if (!file) {
    return new Response("Screenshot not found", { status: 404 });
  }

  return new Response(file.data as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

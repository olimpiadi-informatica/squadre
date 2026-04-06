"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { sendInstituteEmail } from "~/lib/email";
import { getRoundAdmin } from "~/lib/round";

export async function sendEmail(
  editionId: string,
  roundId: string,
  instituteId: string,
  revalidate = true,
) {
  await verifyAdmin();

  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);
  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundId} not found`);

  await sendInstituteEmail(edition, round, instituteId);
  if (revalidate) {
    revalidatePath(`/admin/edition/${editionId}/round/${roundId}/email`);
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { sendInstituteEmail } from "~/lib/email";
import { PASSWORD_EMAIL_TEMPLATE_ID, upsertEmailTemplateContent } from "~/lib/email-template";
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

export async function savePasswordEmailTemplate(
  editionId: string,
  roundId: string,
  content: string,
) {
  await verifyAdmin();

  await upsertEmailTemplateContent(PASSWORD_EMAIL_TEMPLATE_ID, content);
  revalidatePath(`/admin/edition/${editionId}/round/${roundId}/email`);
}

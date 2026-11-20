"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { sendInstitutePenalizationEmail } from "~/lib/email";
import {
  PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID,
  PENALIZATION_EMAIL_TEMPLATE_ID,
  upsertEmailTemplateContent,
} from "~/lib/email-template";
import { getRoundAdmin } from "~/lib/round";
import { refreshViews } from "~/lib/view";

function emailPath(editionId: string, roundSlug: string) {
  return `/admin/edition/${editionId}/round/${roundSlug}/penalization-email`;
}

export async function sendPenalizationEmail(
  editionId: string,
  roundSlug: string,
  instituteId: string,
) {
  await verifyAdmin();

  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) throw new Error(`Round ${roundSlug} not found`);

  await sendInstitutePenalizationEmail(round, instituteId);
  await refreshViews();
  revalidatePath(emailPath(editionId, roundSlug));
}

export async function savePenalizationEmailTemplate(
  editionId: string,
  roundSlug: string,
  content: string,
) {
  await verifyAdmin();

  await upsertEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID, content);
  revalidatePath(emailPath(editionId, roundSlug));
}

export async function savePenalizationAppealResultEmailTemplate(
  editionId: string,
  roundSlug: string,
  content: string,
) {
  await verifyAdmin();

  await upsertEmailTemplateContent(PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID, content);
  revalidatePath(emailPath(editionId, roundSlug));
}

"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { sendInstitutePenalizationEmail, sendPenalizationAppealResultEmail } from "~/lib/email";
import {
  PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID,
  PENALIZATION_EMAIL_TEMPLATE_ID,
  upsertEmailTemplateContent,
} from "~/lib/email-template";
import { importRoundPlagiarismPenalization, reviewPenalizationAppeal } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";
import { refreshViews } from "~/lib/view";

export async function uploadRoundPlagiarismPenalization(
  editionId: string,
  roundSlug: string,
  formData: FormData,
) {
  await verifyAdmin();

  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) {
    throw new Error("Round non trovato.");
  }

  const files = formData.getAll("files");
  if (files.length === 0) {
    throw new Error("Nessun file TSV caricato.");
  }

  await importRoundPlagiarismPenalization(editionId, roundSlug, files);
  await refreshViews();
  revalidatePath("/", "layout");
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
  revalidatePath("/", "layout");
}

export async function savePenalizationEmailTemplate(
  editionId: string,
  roundSlug: string,
  content: string,
) {
  await verifyAdmin();

  await upsertEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID, content);
  revalidatePath(`/admin/edition/${editionId}/round/${roundSlug}/penalization`);
}

export async function savePenalizationAppealResultEmailTemplate(
  editionId: string,
  roundSlug: string,
  content: string,
) {
  await verifyAdmin();

  await upsertEmailTemplateContent(PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID, content);
  revalidatePath(`/admin/edition/${editionId}/round/${roundSlug}/penalization`);
}

export async function reviewAppeal(
  editionId: string,
  roundSlug: string,
  penalizationId: number,
  approved: boolean,
) {
  await verifyAdmin();
  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) throw new Error(`Round ${roundSlug} not found`);

  await reviewPenalizationAppeal(round.id, penalizationId, approved);
  await refreshViews();
  revalidatePath("/", "layout");
  await sendPenalizationAppealResultEmail(round, penalizationId, approved);
}

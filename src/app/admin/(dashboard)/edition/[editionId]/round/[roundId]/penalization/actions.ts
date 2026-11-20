"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import type { PenalizationLevel } from "~/lib/db/schema";
import { sendPenalizationAppealResultEmail } from "~/lib/email";
import {
  createProctoringPenalization,
  importRoundPlagiarismPenalization,
  importRoundProctoringPenalization,
  reviewPenalizationAppeal,
  updatePenalizationDetails,
} from "~/lib/penalization";
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

export async function uploadRoundProctoringPenalization(
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
    throw new Error("Nessun file CSV caricato.");
  }

  await importRoundProctoringPenalization(editionId, roundSlug, files);
  await refreshViews();
  revalidatePath("/", "layout");
}

export async function createRoundProctoringPenalization(
  editionId: string,
  roundSlug: string,
  teamSlug: string,
  values: { level: PenalizationLevel; appealAllowed: boolean; description: string },
) {
  await verifyAdmin();

  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) {
    throw new Error("Round non trovato.");
  }

  await createProctoringPenalization(editionId, roundSlug, teamSlug, values);
  await refreshViews();
  revalidatePath("/", "layout");
}

export async function updateRoundPenalization(
  editionId: string,
  roundSlug: string,
  penalizationId: number,
  values: { level: PenalizationLevel; appealAllowed: boolean; description: string },
) {
  await verifyAdmin();

  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) {
    throw new Error("Round non trovato.");
  }

  await updatePenalizationDetails(round.id, penalizationId, values);
  await refreshViews();
  revalidatePath("/", "layout");
}

/**
 * TODO: rimuovere per riattivare la revisione dei ricorsi.
 * Stesso flag di `penalization-table.tsx`.
 */
const APPEAL_REVIEW_DISABLED = true;

export async function reviewAppeal(
  editionId: string,
  roundSlug: string,
  penalizationId: number,
  approved: boolean,
) {
  await verifyAdmin();
  if (APPEAL_REVIEW_DISABLED) {
    throw new Error("Gestione ricorsi temporaneamente disabilitata.");
  }
  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) throw new Error(`Round ${roundSlug} not found`);

  await reviewPenalizationAppeal(round.id, penalizationId, approved);
  await refreshViews();
  revalidatePath("/", "layout");
  await sendPenalizationAppealResultEmail(round, penalizationId, approved);
}

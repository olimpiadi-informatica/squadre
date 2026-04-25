"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { importRoundPlagiarismPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

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
  revalidatePath(`/admin/edition/${editionId}/round/${roundSlug}/penalization`);
}

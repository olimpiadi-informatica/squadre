"use server";

import { revalidatePath } from "next/cache";

import { verifyAdmin } from "~/lib/admin";
import { createRoundInternetPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";
import { refreshViews } from "~/lib/view";

export async function createInternetPenalization(
  editionId: string,
  roundSlug: string,
  filters: { missingThreshold: number; failedThreshold: number },
) {
  await verifyAdmin();

  const round = await getRoundAdmin(editionId, roundSlug);
  if (!round) {
    throw new Error("Round non trovato.");
  }

  await createRoundInternetPenalization(editionId, roundSlug, filters);
  await refreshViews();

  revalidatePath("/", "layout");
}

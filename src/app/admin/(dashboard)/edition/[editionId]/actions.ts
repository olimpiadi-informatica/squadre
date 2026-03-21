"use server";

import { revalidatePath } from "next/cache";

import { updateRoundVisibility } from "~/lib/round";

export async function toggleRoundVisibility(
  editionId: string,
  roundId: string,
  currentPublic: number,
) {
  await updateRoundVisibility(editionId, roundId, currentPublic === 1 ? 0 : 1);
  revalidatePath(`/admin/edition/${editionId}`);
}

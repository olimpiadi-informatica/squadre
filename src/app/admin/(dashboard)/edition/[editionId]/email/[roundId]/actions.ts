"use server";

import { revalidatePath } from "next/cache";

import { getEditionAdmin } from "~/lib/edition";
import { listRoundEmailStatuses, sendInstituteEmail } from "~/lib/email";
import { getRoundAdmin } from "~/lib/round";

export async function sendEmail(editionId: string, roundId: string, instituteId: string) {
  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);
  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundId} not found`);

  await sendInstituteEmail(edition, round, instituteId);
  revalidatePath(`/admin/edition/${editionId}/email/${roundId}`);
}

export async function sendAllEmails(editionId: string, roundId: string) {
  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);
  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundId} not found`);

  const _statuses = await listRoundEmailStatuses(editionId, roundId);
  // TODO
  // await Promise.allSettled(statuses.map((s) => sendInstituteEmail(edition, round, s.instituteId)));
  revalidatePath(`/admin/edition/${editionId}/email/${roundId}`);
}

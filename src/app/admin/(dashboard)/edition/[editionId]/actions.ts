"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { addHours, format, getUnixTime, subMinutes } from "date-fns";
import YAML from "yaml";

import { getEditionAdmin } from "~/lib/edition";
import { listRegions } from "~/lib/region";
import { getRoundAdmin, updateRoundVisibility } from "~/lib/round";

export async function toggleRoundVisibility(
  editionId: string,
  roundId: string,
  currentPublic: number,
) {
  await updateRoundVisibility(editionId, roundId, currentPublic === 1 ? 0 : 1);
  revalidatePath(`/admin/edition/${editionId}`);
}

export async function getRoundCredentials(editionId: string, roundId: string): Promise<string> {
  const [edition, round, regions] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRegions(),
  ]);

  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundId} not found`);

  const year = edition.year.replace(/\d{2}\//, "");
  const dateStr = format(new TZDate(round.startsAt, "Europe/Rome"), "MMMM do, yyyy");
  const start = subMinutes(round.startsAt, 5);
  const stop = addHours(start, 3);

  return YAML.stringify({
    name: `round${round.id}`,
    description: `OIS${year} -- ${round.title} (regular)`,
    date: dateStr,
    start: getUnixTime(start),
    stop: getUnixTime(stop),
    token_mode: "disabled",
    allow_registration: false,
    allow_user_tests: false,
    timezone: "Europe/Rome",
    location: "Online",
    logo: "logo_ois.pdf",
    languages: [],
    tasks: [],
    teams: regions.map((r) => ({ code: r.id.toUpperCase(), name: r.name })),
  });
}

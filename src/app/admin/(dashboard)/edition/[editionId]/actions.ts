"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { addHours, format, getUnixTime, subMinutes } from "date-fns";
import { truncate } from "lodash";
import YAML from "yaml";

import { getEditionAdmin } from "~/lib/edition";
import { createCredentialsPdf } from "~/lib/foglietti";
import { listRegions } from "~/lib/region";
import { getRoundAdmin, updateRoundVisibility } from "~/lib/round";
import { listRoundTeamsCredentials } from "~/lib/team";

export async function toggleRoundVisibility(
  editionId: string,
  roundId: string,
  currentPublic: boolean,
) {
  await updateRoundVisibility(editionId, roundId, !currentPublic);
  revalidatePath(`/admin/edition/${editionId}`);
}

export async function getRoundCredentials(editionId: string, roundId: string): Promise<string> {
  const [edition, round, regions, teamCredentials] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRegions(),
    listRoundTeamsCredentials(editionId, roundId),
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
    users: teamCredentials.map((t) => ({
      first_name: t.name,
      last_name: `${t.instituteName}, ${t.instituteCity}`,
      team: t.regionId.toUpperCase(),
      username: t.teamId,
      password: t.password,
      hidden: false,
      delay: t.delay,
    })),
  });
}

export async function getFogliettiPdf(editionId: string, roundId: string) {
  const teamCredentials = await listRoundTeamsCredentials(editionId, roundId);
  const credentials = teamCredentials.map((t) => ({
    teamName: truncate(t.name, { length: 36 }),
    school: truncate(`${t.instituteName}, ${t.instituteCity}`, { length: 64 }),
    username: t.teamId,
    password: t.password,
  }));
  return createCredentialsPdf(credentials);
}

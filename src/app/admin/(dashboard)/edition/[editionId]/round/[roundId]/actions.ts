"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { addHours, format, getUnixTime, subMinutes } from "date-fns";
import { truncate } from "lodash";
import YAML from "yaml";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { createCredentialsPdf } from "~/lib/foglietti";
import { listRegions } from "~/lib/region";
import { parseRanking } from "~/lib/result";
import { getRoundAdmin, updateRoundVisibility } from "~/lib/round";
import { listRoundTeamsCredentials } from "~/lib/team";

export async function getRoundCredentials(
  editionId: string,
  roundId: string,
  junior: boolean,
): Promise<string> {
  await verifyAdmin();

  const [edition, round, regions, teamCredentials] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRegions(),
    listRoundTeamsCredentials(editionId, roundId, junior),
  ]);

  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundId} not found`);

  const year = edition.year.replace(/\d{2}\//, "");
  const dateStr = format(new TZDate(round.startsAt, "Europe/Rome"), "MMMM do, yyyy");
  const start = round.slug.length === 1 ? subMinutes(round.startsAt, 5) : round.startsAt;
  const stop = addHours(start, 3);

  return YAML.stringify(
    {
      name: `round${round.slug}${junior ? "-debutant" : ""}`,
      description: `OIS${year} -- ${round.title} (${junior ? "debutant" : "regular"})`,
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
        username: t.slug,
        password: t.password,
        hidden: false,
        delay: t.delay,
      })),
    },
    { lineWidth: 0 },
  );
}

export async function getFogliettiPdf(editionId: string, roundId: string) {
  await verifyAdmin();

  const teamCredentials = await listRoundTeamsCredentials(editionId, roundId);
  const credentials = teamCredentials.map((t) => ({
    teamName: truncate(t.name, { length: 36 }),
    school: truncate(`${t.instituteName}, ${t.instituteCity}`, { length: 64 }),
    username: t.slug,
    password: t.password,
  }));
  return createCredentialsPdf(credentials);
}

export async function uploadRoundResults(
  editionId: string,
  roundSlug: string,
  formData: FormData,
): Promise<void> {
  await verifyAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Nessun file fornito");

  const roundRow = await getRoundAdmin(editionId, roundSlug);
  if (!roundRow) throw new Error(`Round "${roundSlug}" non trovato`);

  await parseRanking(file, editionId, roundRow.id);
  await updateRoundVisibility(editionId, roundSlug, true);
  revalidatePath(`/admin/edition/${editionId}`);
}

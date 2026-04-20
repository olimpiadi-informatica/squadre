"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { format, getUnixTime, hoursToSeconds } from "date-fns";
import { delay } from "es-toolkit";
import YAML from "yaml";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { mirrorTeams } from "~/lib/mirror-teams";
import { listRegions } from "~/lib/region";
import { parseResult, UploadResultStep } from "~/lib/result";
import { getRoundAdmin } from "~/lib/round";
import { getRoundEndForTeam, getRoundStartForTeam } from "~/lib/round-config";
import { listRoundTasks, type RoundTaskItem, saveRoundTasksForRound } from "~/lib/task";
import { listRoundTeamsCredentials } from "~/lib/team";

const languages = [
  "C++20 / g++",
  "C11 / gcc",
  "Java / JDK",
  "Python 3 / PyPy",
  "Pascal / fpc",
  "C# / Mono",
];

export async function getRoundCredentials(
  editionId: string,
  roundSlug: string,
  junior: boolean,
): Promise<string> {
  const { year, dateStr, start, contestStop, round, roundTasks, regions, teamCredentials } =
    await getCredentialData(editionId, roundSlug, junior);

  return YAML.stringify(
    {
      name: `round${round.slug}${junior ? "-debutant" : ""}`,
      description: `OIS${year} -- ${round.title} (${junior ? "debutant" : "regular"})`,
      date: dateStr,
      start: getUnixTime(start),
      stop: getUnixTime(contestStop),
      token_mode: "disabled",
      allow_registration: false,
      allow_user_tests: false,
      timezone: "Europe/Rome",
      location: "Online",
      logo: "logo_ois.pdf",
      languages,
      tasks: roundTasks.map((task) => task.slug),
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

export async function getMirrorCredentials(
  editionId: string,
  roundSlug: string,
  junior: boolean,
): Promise<string> {
  const { year, dateStr, start, contestStop, round, roundTasks } = await getCredentialData(
    editionId,
    roundSlug,
    junior,
  );

  return YAML.stringify(
    {
      name: `round${round.slug}${junior ? "-debutant" : ""}`,
      description: `IIOT${year} -- ${round.title} (${junior ? "debutant" : "regular"})`,
      date: dateStr,
      start: getUnixTime(start),
      stop: getUnixTime(contestStop),
      token_mode: "disabled",
      allow_registration: true,
      allow_user_tests: false,
      per_user_time: hoursToSeconds(3),
      timezone: "Europe/Rome",
      location: "Online",
      logo: "logo.pdf",
      languages,
      tasks: roundTasks.map((task) => task.slug),
      teams: mirrorTeams,
      users: mirrorTeams.map((team) => ({
        team: team.code,
        username: team.code,
        password: team.code,
        hidden: true,
        last_name: "",
        first_name: team.name,
      })),
    },
    { lineWidth: 0 },
  );
}

async function getCredentialData(editionId: string, roundSlug: string, junior: boolean) {
  await verifyAdmin();

  const [edition, round, roundTasks, regions, teamCredentials] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundSlug),
    listRoundTasks(editionId, roundSlug, junior),
    listRegions(),
    listRoundTeamsCredentials(editionId, roundSlug, junior),
  ]);

  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundSlug} not found`);

  const year = edition.year.replace(/\d{2}\//, "");
  const dateStr = format(new TZDate(round.startsAt, "Europe/Rome"), "MMMM do, yyyy");
  const start = getRoundStartForTeam(round.startsAt, round.slug);
  const contestStop = getRoundEndForTeam(round.startsAt, round.endsAt, round.slug);

  return {
    year,
    dateStr,
    start,
    contestStop,
    round,
    roundTasks,
    regions,
    teamCredentials,
  };
}

export async function uploadRoundResults(
  editionId: string,
  roundSlug: string,
  formData: FormData,
): Promise<ReadableStream<{ step: UploadResultStep; error?: string }>> {
  await verifyAdmin();

  return new ReadableStream<{ step: UploadResultStep; error?: string }>({
    async start(controller) {
      try {
        const file = formData.get("file");
        if (!(file instanceof File)) {
          controller.enqueue({
            step: UploadResultStep.UPLOAD_ARCHIVE,
            error: "Nessun file caricato",
          });
          return;
        }

        let lastStep = UploadResultStep.UPLOAD_ARCHIVE;
        let stepThrottle = delay(1000);
        try {
          for await (const step of parseResult(file, editionId, roundSlug)) {
            if (lastStep !== step) {
              lastStep = step;
              await stepThrottle;
              stepThrottle = delay(1000);
            }
            controller.enqueue({ step });
          }
        } catch (err: any) {
          console.error(err);
          controller.enqueue({ step: lastStep, error: err.message });
        }

        revalidatePath(`/admin/edition/${editionId}`);
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}

export async function saveRoundTasks(
  editionId: string,
  roundId: number,
  roundSlug: string,
  inputTasks: RoundTaskItem[],
): Promise<void> {
  await verifyAdmin();
  await saveRoundTasksForRound(roundId, inputTasks);

  revalidatePath(`/admin/edition/${editionId}/round/${roundSlug}`);
  revalidatePath(`/admin/edition/${editionId}`);
}

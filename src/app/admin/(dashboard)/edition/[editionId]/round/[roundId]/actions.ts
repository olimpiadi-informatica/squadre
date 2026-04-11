"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { addHours, format, getUnixTime, subMinutes } from "date-fns";
import YAML from "yaml";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRegions } from "~/lib/region";
import { parseResult, UploadResultStep } from "~/lib/result";
import { getRoundAdmin } from "~/lib/round";
import { listRoundTasks, type RoundTaskItem, saveRoundTasksForRound } from "~/lib/task";
import { listRoundTeamsCredentials } from "~/lib/team";

export async function getRoundCredentials(
  editionId: string,
  roundSlug: string,
  junior: boolean,
): Promise<string> {
  await verifyAdmin();

  const [edition, round, regions, teamCredentials, roundTasks] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundSlug),
    listRegions(),
    listRoundTeamsCredentials(editionId, roundSlug, junior),
    listRoundTasks(editionId, roundSlug, junior),
  ]);

  if (!edition) throw new Error(`Edition ${editionId} not found`);
  if (!round) throw new Error(`Round ${roundSlug} not found`);

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
      languages: [
        "C++20 / g++",
        "C11 / gcc",
        "Java / JDK",
        "Python 3 / PyPy",
        "Pascal / fpc",
        "C# / Mono",
      ],
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
        try {
          for await (const step of parseResult(file, editionId, roundSlug)) {
            lastStep = step;
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

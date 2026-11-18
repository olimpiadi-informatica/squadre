"use server";

import { revalidatePath } from "next/cache";

import { TZDate } from "@date-fns/tz";
import { format, formatISO, hoursToSeconds } from "date-fns";
import { delay } from "es-toolkit";
import YAML from "yaml";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { mirrorTeams } from "~/lib/mirror-teams";
import { listRegions } from "~/lib/region";
import { parseResult, UploadResultStep } from "~/lib/result";
import { getRoundAdmin } from "~/lib/round";
import { getRoundEndForTeam, getRoundStartForTeam } from "~/lib/round-config";
import {
  listRoundTasks,
  type RoundTaskItem,
  saveRoundTasksForRound,
  validateRoundTaskUpdate,
} from "~/lib/task";
import { listRoundTeamsCredentials } from "~/lib/team";
import { refreshViews } from "~/lib/view";

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
      start,
      stop: contestStop,
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
        hidden: t.hidden,
        unrestricted: t.unrestricted,
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
      start,
      stop: contestStop,
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
  const start = formatISO(
    new TZDate(getRoundStartForTeam(round.startsAt, round.slug), "Europe/Rome"),
  );
  const contestStop = formatISO(
    new TZDate(getRoundEndForTeam(round.startsAt, round.endsAt, round.slug), "Europe/Rome"),
  );

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

type UploadResultMessage = {
  step: UploadResultStep;
  error?: string;
  warnings?: string[];
};

// Alcuni step restano a lungo senza produrre nulla (il salvataggio proctoring
// su uno storico grande, il refresh delle materialized view finale). Il proxy
// davanti all'app chiude le risposte silenziose troppo a lungo: nginx di
// default dopo 60 secondi di `proxy_read_timeout`. Un battito con l'ultimo
// step tiene viva la connessione, e il client ignora gli step ripetuti.
const HEARTBEAT_INTERVAL_MS = 10_000;

export async function uploadRoundResults(
  editionId: string,
  roundSlug: string,
  formData: FormData,
): Promise<ReadableStream<UploadResultMessage>> {
  await verifyAdmin();

  return new ReadableStream<UploadResultMessage>({
    async start(controller) {
      let lastStep = UploadResultStep.UPLOAD_ARCHIVE;
      let closed = false;
      const send = (message: UploadResultMessage) => {
        if (closed) return;
        try {
          controller.enqueue(message);
        } catch {
          // Connessione chiusa dal client: smettiamo di scrivere, ma il
          // lavoro in corso prosegue fino in fondo per non lasciare il
          // database a metà.
          closed = true;
        }
      };
      const heartbeat = setInterval(() => send({ step: lastStep }), HEARTBEAT_INTERVAL_MS);

      try {
        const file = formData.get("file");
        if (!(file instanceof File)) {
          send({ step: UploadResultStep.UPLOAD_ARCHIVE, error: "Nessun file caricato" });
          return;
        }

        const warnings: string[] = [];
        let stepThrottle = delay(1000);
        try {
          await parseResult(file, editionId, roundSlug, {
            onWarning: (message) => {
              warnings.push(message);
            },
            onStep: async (step) => {
              if (lastStep !== step) {
                lastStep = step;
                await stepThrottle;
                stepThrottle = delay(1000);
              }
              send({ step });
            },
          });
        } catch (err: any) {
          console.error(err);
          send({ step: lastStep, error: err.message });
        }

        if (warnings.length > 0) {
          send({ step: lastStep, warnings });
        }

        revalidatePath("/", "layout");
      } catch (err) {
        controller.error(err);
      } finally {
        closed = true;
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });
}

export async function saveRoundTasks(roundId: number, inputTasks: RoundTaskItem[]): Promise<void> {
  await verifyAdmin();
  await validateRoundTaskUpdate(roundId, inputTasks);
  await saveRoundTasksForRound(roundId, inputTasks);
  await refreshViews();

  revalidatePath("/", "layout");
}

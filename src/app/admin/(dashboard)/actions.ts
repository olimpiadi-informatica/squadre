"use server";

import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isString, uniqBy } from "lodash";
import Papa from "papaparse";
import { z } from "zod";

import { deleteEdition, updateEditionVisibility } from "~/lib/edition";
import { createNewEdition, type EditionData } from "~/lib/new-edition";

const csvRowSchema = z.object({
  "ID concorrente": z.coerce.number().int(),
  "Nome concorrente": z
    .string()
    .min(1)
    .transform((s) => s.replaceAll(/\p{White_Space}+/gu, " ").trim()),
  "Approvato/a": z.enum(["True", "False", ""]),
  "Idoneo/a": z.enum(["True", "False"]),
  "ID scuola": z.coerce.number().int(),
  "Codice meccanografico": z
    .string()
    .min(1)
    .transform((s) => s.toLowerCase()),
  "Nome scuola": z.string().min(1),
  "Città scuola": z.string().min(1),
  "Regione scuola": z
    .string()
    .min(1)
    .transform((s) => s.toLowerCase().slice(0, 3)),
  "Nome referente": z.string().min(1),
  "Cognome referente": z.string().min(1),
  "Scelta del campionato": z.enum(["Regolare", "Esordienti", ""]),
});

export async function toggleEditionVisibility(id: string, currentPublic: boolean) {
  await updateEditionVisibility(id, !currentPublic);
  revalidatePath("/admin");
}

export async function deleteEditionAction(id: string) {
  await deleteEdition(id);
  revalidatePath("/admin");
}

export async function createEdition(files: FormData, data: EditionData) {
  const teamCsv = files.get("teams");
  if (teamCsv == null) {
    throw new Error("No teams CSV file provided");
  }
  const rows = await parseCsv(teamCsv);

  const institutes = uniqBy(
    rows.map((row) => ({
      id: row["Codice meccanografico"],
      name: row["Nome scuola"],
      city: row["Città scuola"],
      region: row["Regione scuola"],
    })),
    ({ id }) => id,
  );

  const regionCounters = new Map<string, number>();

  const teams = rows.map((row) => {
    const region = row["Regione scuola"];
    const prefix = row["Scelta del campionato"] === "Esordienti" ? "b" : "t";
    const key = `${prefix}-${region}`;
    const counter = (regionCounters.get(key) ?? 0) + 1;
    regionCounters.set(key, counter);
    const id = `${key}-${String(counter).padStart(3, "0")}`;

    return {
      id,
      editionId: data.id,
      name: row["Nome concorrente"],
      instId: row["Codice meccanografico"],
      coach: `${row["Nome referente"]} ${row["Cognome referente"]}`,
      finalist: false,
      rankReg: 0,
      rankTot: 0,
      points: 0,
    };
  });

  await createNewEdition(data, institutes, teams);
  revalidatePath("/admin");
  redirect(`/admin/edition/${data.id}`);
}

async function parseCsv(csv: File | string) {
  const source = isString(csv) ? csv : Readable.fromWeb(csv.stream() as ReadableStream);

  const rows = await new Promise<unknown[]>((resolve, reject) => {
    Papa.parse(source, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
    });
  });
  return z
    .array(csvRowSchema)
    .parse(rows)
    .filter((row) => row["Approvato/a"] === "True" && row["Idoneo/a"] === "True");
}

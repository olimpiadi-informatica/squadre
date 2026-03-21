"use server";

import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

import { revalidatePath } from "next/cache";

import { isString } from "lodash";
import Papa from "papaparse";
import { z } from "zod";

import { updateEditionVisibility } from "~/lib/edition";

export async function toggleEditionVisibility(id: string, currentPublic: number) {
  await updateEditionVisibility(id, currentPublic === 1 ? 0 : 1);
  revalidatePath("/admin");
}

const csvRowSchema = z.object({
  "ID concorrente": z.coerce.number().int(),
  "Nome concorrente": z.string().min(1),
  "Idoneo/a": z.enum(["True", "False", ""]),
  "ID scuola": z.coerce.number().int(),
  "Codice meccanografico": z.string().min(1),
  "Nome scuola": z.string().min(1),
  "Città scuola": z.string().min(1),
  "Regione scuola": z.string().min(1),
  "Nome referente": z.string().min(1),
  "Cognome referente": z.string().min(1),
});

export type EditionData = {
  id: string;
  year: string;
  title: string;
  round1Date: Date;
  round2Date: Date;
  round3Date: Date;
  round4Date: Date;
  roundFinalDate: Date;
};

export async function createEdition(files: FormData, _data: EditionData) {
  const teamCsv = files.get("teams");
  if (teamCsv == null) {
    throw new Error("No teams CSV file provided");
  }
  const rows = await parseCsv(teamCsv);
  console.log(rows);

  revalidatePath("/admin");
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
  return z.array(csvRowSchema).parse(rows);
}

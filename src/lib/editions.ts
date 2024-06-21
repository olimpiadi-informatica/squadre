import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema } from "./common";

const editionSchema = z
  .object({
    average: z.number(),
    avgpos: z.number(),
    fullscore: z.number(),
    highest: z.number(),
    id: z.number(),
    instnum: z.number(),
    lastEd: z.number(),
    medpos: z.number(),
    name: z.string(),
    points: z.number(),
    positive: z.number(),
    regions: z.number(),
    tasks: z.number(),
    teams: z.number(),
    title: z.string(),
    year: z.string(),
  })
  .strict();

const editionsSchema = z
  .object({
    allreg: z.number(),
    avgreg: z.number(),
    instnum: z.number(),
    points: z.number(),
    regions: z.number(),
    tasks: z.number(),
    teams: z.number(),
    highlights: highlightSchema.array(),
    editions: editionSchema.array(),
  })
  .strict();

export type Editions = z.infer<typeof editionsSchema>;

export async function getEditions(): Promise<Editions> {
  return editionsSchema.parseAsync(JSON.parse(await readFile("data/json/edition.json", "utf8")));
}

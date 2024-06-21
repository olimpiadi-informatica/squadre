import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const regionSchema = z
  .object({
    avgrank: z.number(),
    bestavgrank: z.number(),
    bestbestavgrank: z.number(),
    bestedrank: z.number(),
    bestrank: z.number(),
    id: z.string(),
    instnum: z.number(),
    medals: medalsSchema,
    name: z.string(),
    participations: z.number().array(),
    points: z.number(),
    teams: z.number(),
  })
  .strict();

const regionsSchema = z
  .object({
    allpart: z.number(),
    avgpart: z.number(),
    editions: z.number(),
    highlights: highlightSchema.array(),
    instnum: z.number(),
    medals: medalsSchema,
    points: z.number(),
    regions: regionSchema.array(),
    tasks: z.number(),
    teams: z.number(),
  })
  .strict();

export type Regions = z.infer<typeof regionsSchema>;

export async function getRegions(): Promise<Regions> {
  return regionsSchema.parseAsync(JSON.parse(await readFile("data/json/region.json", "utf8")));
}

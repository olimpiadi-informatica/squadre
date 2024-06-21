import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const instituteSchema = z
  .object({
    avgrank: z.number(),
    bestavgrank: z.number(),
    bestedrank: z.number(),
    bestrank: z.number(),
    city: z.string(),
    fullregion: z.string(),
    id: z.string(),
    medals: medalsSchema,
    name: z.string(),
    participations: z.number().array(),
    points: z.number(),
    region: z.string(),
    teams: z.number(),
  })
  .strict();

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
    highlights: highlightSchema.array(),
    institutes: instituteSchema.array(),
  })
  .strict();

export type Region = z.infer<typeof regionSchema>;

export async function getRegion(id: string): Promise<Region> {
  return regionSchema.parseAsync(JSON.parse(await readFile(`data/json/region.${id}.json`, "utf8")));
}

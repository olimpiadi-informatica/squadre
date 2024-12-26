import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const teamSchema = z
  .object({
    avgrank: z.number(),
    bestrank: z.number(),
    coach: z.string(),
    edition: z.number(),
    finalist: z.boolean().nullable(),
    fullregion: z.string(),
    id: z.string(),
    inst_id: z.string(),
    institute: z.string(),
    medals: medalsSchema,
    members: z.string().max(0),
    name: z.string(),
    points: z.number(),
    rank_excl: z.number(),
    rank_reg: z.number(),
    rank_tot: z.number(),
    region: z.string(),
  })
  .strict();

const editionSchema = z
  .object({
    avgrank: z.number(),
    medals: medalsSchema,
    num: z.number(),
    points: z.number(),
    teams: teamSchema.array(),
    title: z.string(),
    year: z.string(),
  })
  .strict();

const instituteSchema = z
  .object({
    avgrank: z.number(),
    bestavgrank: z.number(),
    bestedrank: z.number(),
    bestrank: z.number(),
    city: z.string(),
    editions: editionSchema.array(),
    fullregion: z.string(),
    highlights: highlightSchema.array(),
    medals: medalsSchema,
    name: z.string(),
    participations: z.number().array(),
    points: z.number(),
    region: z.string(),
    teams: z.number(),
  })
  .strict();

export type Institute = z.infer<typeof instituteSchema>;

export async function getInstitute(region: string, id: string): Promise<Institute> {
  return instituteSchema.parseAsync(
    JSON.parse(await readFile(`data/json/region.${region}.${id}.json`, "utf8")),
  );
}

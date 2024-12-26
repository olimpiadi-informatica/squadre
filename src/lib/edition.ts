import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema } from "./common";

const taskSchema = z
  .object({
    name: z.string(),
    title: z.string(),
  })
  .strict();

const contestSchema = z
  .object({
    average: z.number().nullish(),
    avgpos: z.number().nullish(),
    edition: z.string().optional(),
    fullscore: z.number().nullable(),
    highest: z.number().nullish(),
    id: z.string(),
    medpos: z.number().nullish(),
    name: z.string(),
    positive: z.number().nullish(),
    tasks: taskSchema.array().nullable(),
    title: z.string(),
  })
  .strict();

const teamSchema = z
  .object({
    average: z.number().optional(),
    avgpos: z.number().optional(),
    edition: z.string().optional(),
    finalist: z.boolean().nullable(),
    fullregion: z.string(),
    highest: z.number().optional(),
    id: z.string(),
    inst_id: z.string(),
    institute: z.string(),
    medpos: z.number().optional(),
    name: z.string(),
    positive: z.number().optional(),
    region: z.string(),
  })
  .strict();

const medalist = z
  .object({
    rank: z.number(),
    rank_reg: z.number(),
    total: z.number(),
    scores: z.number().array(),
    team: teamSchema,
  })
  .strict();

const teamResultSchema = z
  .object({
    rank_excl: z.number(),
    rank_reg: z.number(),
    rank_tot: z.number(),
    rounds: z.number().nullable().array(),
    team: teamSchema,
    total: z.number(),
  })
  .strict();

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
    contests: contestSchema.array(),
    final: z
      .object({ ranking: medalist.array().length(3) })
      .strict()
      .nullable(),
    rounds: teamResultSchema.array(),
    highlights: highlightSchema.array(),
  })
  .strict();

export type Edition = z.infer<typeof editionSchema>;

export async function getEdition(id: string | number): Promise<Edition> {
  return editionSchema.parseAsync(
    JSON.parse(await readFile(`data/json/edition.${id}.json`, "utf8")),
  );
}

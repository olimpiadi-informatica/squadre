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
    fullscore: z.number(),
    id: z.string(),
    name: z.string(),
    tasks: taskSchema.array(),
    title: z.string(),
  })
  .strict();

const teamSchema = z
  .object({
    finalist: z.boolean().nullable(),
    fullregion: z.string(),
    id: z.string(),
    inst_id: z.string(),
    institute: z.string(),
    name: z.string(),
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
    rounds: z.number().array(),
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
    final: z.object({ ranking: medalist.array().length(3) }).strict(),
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

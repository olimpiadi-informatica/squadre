import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const teamSchema = z
  .object({
    avgrank: z.number(),
    bestrank: z.number(),
    coach: z.string(),
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

const teamResultSchema = z
  .object({
    rank: z.number(),
    score: z.number(),
    team: teamSchema,
  })
  .strict();

const taskSchema = z.object({
  ed_id: z.number(),
  edition: z.string(),
  year: z.string(),
  round: z.string(),
  r_id: z.string(),
  ranking: teamResultSchema.array(),
  name: z.string(),
  title: z.string(),
  statement: z.string(),
  points: z.number(),
  medpos: z.number(),
  avgpos: z.number(),
  average: z.number(),
  highest: z.number(),
  positive: z.number(),
  fullscore: z.number(),
  fullscores: z.number(),
  highlights: highlightSchema.array(),
});

export type Task = z.infer<typeof taskSchema>;

export async function getTask(
  edition: string | number,
  round: string,
  name: string,
): Promise<Task> {
  return taskSchema.parseAsync(
    JSON.parse(await readFile(`data/json/edition.${edition}.round.${round}.${name}.json`, "utf8")),
  );
}

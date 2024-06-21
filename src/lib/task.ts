import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  institute: z.string(),
  inst_id: z.string(),
  region: z.string(),
  fullregion: z.string(),
  coach: z.string(),
  members: z.string().max(0),
  finalist: z.boolean(),
  medals: medalsSchema,
  rank_reg: z.number(),
  rank_tot: z.number(),
  rank_excl: z.number(),
  bestrank: z.number(),
  avgrank: z.number(),
  points: z.number(),
});

const teamResultSchema = z.object({
  rank: z.number(),
  score: z.number(),
  team: teamSchema,
});

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

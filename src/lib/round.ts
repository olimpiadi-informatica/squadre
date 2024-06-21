import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema } from "./common";

const taskSchema = z
  .object({
    name: z.string(),
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

const teamResultSchema = z
  .object({
    rank_reg: z.number(),
    rank: z.number(),
    scores: z.number().array(),
    team: teamSchema,
    total: z.number(),
  })
  .strict();

const roundSchema = z
  .object({
    average: z.number(),
    avgpos: z.number(),
    ed_num: z.number(),
    edition: z.string(),
    fullscore: z.number(),
    highest: z.number(),
    highlights: highlightSchema.array(),
    id: z.string(),
    lastEd: z.number(),
    lastRound: z.string(),
    medpos: z.number(),
    name: z.string(),
    points: z.number(),
    positive: z.number(),
    provisional: z.boolean(),
    ranking: teamResultSchema.array(),
    tasks: taskSchema.array(),
    teams: z.number(),
    title: z.string(),
  })
  .strict();

export type Round = z.infer<typeof roundSchema>;

export async function getRound(edition: string | number, id: string): Promise<Round> {
  return roundSchema.parseAsync(
    JSON.parse(await readFile(`data/json/edition.${edition}.round.${id}.json`, "utf8")),
  );
}

import { readFile } from "node:fs/promises";

import { z } from "zod";

import { highlightSchema, medalsSchema } from "./common";

const taskSchema = z
  .object({
    average: z.number(),
    fullscores: z.number(),
    name: z.string(),
    title: z.string(),
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
    rank_reg: z.number(),
    rank_tot: z.number(),
    scores: z.number().array(),
    tasks: taskSchema.array(),
    teams: z.number(),
    title: z.string(),
    total: z.number(),
  })
  .strict();

const teamSchema = z
  .object({
    avgrank: z.number(),
    bestrank: z.number(),
    coach: z.string(),
    ed_num: z.number(),
    edition: z.string(),
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
    year: z.string(),
    highlights: highlightSchema.array(),
    contests: roundSchema.array(),
  })
  .strict();

export type Team = z.infer<typeof teamSchema>;

export async function getTeam(edition: string | number, id: string): Promise<Team> {
  return teamSchema.parseAsync(
    JSON.parse(await readFile(`data/json/edition.${edition}.team.${id}.json`, "utf8")),
  );
}

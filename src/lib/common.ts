import { z } from "zod";

export const highlightSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  })
  .strict();

export type Highlight = z.infer<typeof highlightSchema>;

export const medalsSchema = z.number().array().length(4);

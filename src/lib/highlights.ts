import { cache } from "react";

import { eq } from "drizzle-orm";

import { db } from "./db";
import { highlight } from "./db/schema";

export type Highlight = {
  id: number;
  link: string;
  name: string;
  description: string;
};

export const getHighlights = cache((page: string): Promise<Highlight[]> => {
  return db
    .select({
      id: highlight.id,
      link: highlight.link,
      name: highlight.name,
      description: highlight.description,
    })
    .from(highlight)
    .where(eq(highlight.page, page))
    .orderBy(highlight.id);
});

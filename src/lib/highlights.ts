import { cache } from "react";

import { eq } from "drizzle-orm";

import { db } from "~/lib/db";
import { highlight } from "~/lib/db/schema";

export type Highlight = {
  id: number;
  page: string;
  link: string;
  name: string;
  description: string;
};

export const getHighlights = cache((page: string): Promise<Highlight[]> => {
  return db.select().from(highlight).where(eq(highlight.page, page)).orderBy(highlight.id);
});

"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { db } from "~/lib/db";
import { edition } from "~/lib/db/schema";

export async function toggleEditionVisibility(id: string, currentPublic: number) {
  await db
    .update(edition)
    .set({ public: currentPublic === 1 ? 0 : 1 })
    .where(eq(edition.id, id));
  revalidatePath("/admin");
}

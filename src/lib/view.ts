import { db } from "~/lib/db";
import {
  v00a_taskStats,
  v01a_teamTaskScoreStats,
  v02b_teamRoundStats,
  v03b_roundStats,
  v04a_teamStats,
  v05a_editionStats,
  v06a_editionStats2,
  v07a_instituteStats,
  v08a_regionStats,
} from "~/lib/db/schema";
import { refreshHighlights } from "~/lib/highlights";

export async function refreshViews() {
  await db.refreshMaterializedView(v00a_taskStats);
  await db.refreshMaterializedView(v01a_teamTaskScoreStats);
  await db.refreshMaterializedView(v02b_teamRoundStats);
  await db.refreshMaterializedView(v03b_roundStats);
  await db.refreshMaterializedView(v04a_teamStats);
  await db.refreshMaterializedView(v05a_editionStats);
  await db.refreshMaterializedView(v06a_editionStats2);
  await db.refreshMaterializedView(v07a_instituteStats);
  await db.refreshMaterializedView(v08a_regionStats);
  await refreshHighlights();
}

import { drizzle } from "drizzle-orm/better-sqlite3";

export const db = drizzle("data/squadre.db");
db.$client.loadExtension("sqlite/stats");

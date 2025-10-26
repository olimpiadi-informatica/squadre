import { type SQL, sql } from "drizzle-orm";
import type { SQLChunk, SQLWrapper } from "drizzle-orm/sql/sql";

export function coalesce(value: SQL, fallback: number): SQL<number> {
  return sql`COALESCE(${value.mapWith(Number)}, ${fallback})`;
}

export function median(value: SQLWrapper): SQL<number | null> {
  return sql`STATS_MEDIAN(${value})`;
}

export function concat(...value: SQLChunk[]): SQL<string> {
  return sql`CONCAT(${sql.join(value, sql.raw(", "))})`;
}

export function jsonAggregate(key: SQLWrapper, value: SQLWrapper): SQL<string> {
  return sql`JSON_GROUP_OBJECT(${key}, ${value})`;
}

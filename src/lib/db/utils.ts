import { type SQL, sql } from "drizzle-orm";
import type { SQLChunk, SQLWrapper } from "drizzle-orm/sql/sql";

/**
 * `sum`/`avg`/`min`/`max` su `numeric` tornano da Postgres come stringhe: il
 * cast a `float8` le converte in numeri già in Postgres, così non serve alcun
 * parser globale lato `pg` (vedi `src/lib/db/index.ts`). L'arrotondamento a due
 * decimali evita il rumore del virgola mobile nelle somme (1709.3400000000001).
 */
export function coalesce(value: SQL, fallback: number): SQL<number> {
  return sql`ROUND(COALESCE(${value}, ${fallback})::numeric, 2)::float8`;
}

export function median(value: SQLWrapper): SQL<number | null> {
  return sql`ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${value})::numeric, 2)::float8`;
}

export function concat(...value: SQLChunk[]): SQL<string> {
  return sql`CONCAT(${sql.join(value, sql.raw(", "))})`;
}

export function jsonAggregate(key: SQLWrapper, value: SQLWrapper): SQL<string> {
  return sql`JSON_OBJECT_AGG(${key}, ${value})`;
}

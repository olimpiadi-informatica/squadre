import { drizzle } from "drizzle-orm/node-postgres";

// Aggregati e colonne `numeric` tornano numeri già da Postgres: le colonne
// dichiarate `numeric(..., mode: "number")` sono mappate da drizzle, mentre le
// aggregazioni sono convertite con cast espliciti `::float8` / `::int` nelle
// query e nelle viste. Nessun parser globale su `pg` (`types.setTypeParser`
// agirebbe su tutto il processo: script, admin, altre connessioni).
export const db = drizzle(process.env.DATABASE_URL!);

import { drizzle } from "drizzle-orm/node-postgres";

// I timestamp sono colonne `timestamp with time zone`: rappresentano un istante
// assoluto, quindi letture e scritture non dipendono dal fuso del processo.
// Aggregati e colonne `numeric` tornano numeri già da Postgres: le colonne
// dichiarate `numeric(..., mode: "number")` sono mappate da drizzle, mentre le
// aggregazioni sono convertite con cast espliciti `::float8` / `::int` nelle
// query e nelle viste.
export const db = drizzle(process.env.DATABASE_URL!);

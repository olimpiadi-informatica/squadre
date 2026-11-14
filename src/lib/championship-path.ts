import type { Route } from "next";

/** Il campionato principale: "triennio" fino alle OIS 15, "regolari" da OIS 16. */
export const REGOLARI = "regolari";

/** Campionato del biennio, presente dalle OIS 11 alle OIS 15. */
export const BIENNIO = "biennio";

/** Campionato esordienti, nato alle OIS 16. */
export const ESORDIENTI = "esordienti";

/**
 * Path di una pagina di un campionato: i regolari hanno il path "classico"
 * (`/edition/:id/round/:roundId`), gli altri aggiungono il campionato in fondo
 * (`/edition/:id/round/:roundId/esordienti`).
 */
export function championshipPath(editionId: string, championship: string, path = ""): Route {
  const base = `/edition/${editionId}${path}`;
  return (championship === REGOLARI ? base : `${base}/${championship}`) as Route;
}

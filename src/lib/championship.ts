import type { AnyColumn } from "drizzle-orm";
import { and, eq, ne, type SQL, sql } from "drizzle-orm";

import { BIENNIO, ESORDIENTI, REGOLARI } from "./championship-path";
import { round, team, teamChampionship } from "./db/schema";

export { BIENNIO, ESORDIENTI, REGOLARI };

/**
 * Da quale edizione in poi il campionato non-regolare si chiama "Esordienti":
 * prima era il "Biennio". Solo un problema di etichette (gli slug stabili
 * restano `biennio` e `esordienti`, così i link `?cat=…` non cambiano).
 */
const ESORDIENTI_SINCE_EDITION = 16;

/**
 * Etichetta di un campionato in un'edizione, come nei fogli: fino alle OIS 15
 * si parla di Triennio/Biennio, da OIS 16 di Regolari/Esordienti.
 */
export function championshipLabel(editionId: string, championship: string): string {
  const edition = Number(editionId);
  const modern = !Number.isFinite(edition) || edition >= ESORDIENTI_SINCE_EDITION;
  switch (championship) {
    case REGOLARI:
      return modern ? "Regolari" : "Triennio";
    case BIENNIO:
      return "Biennio";
    case ESORDIENTI:
      return "Esordienti";
    default:
      return championship.charAt(0).toUpperCase() + championship.slice(1);
  }
}

/** I campionati presenti, in ordine di tab: prima i regolari. */
export function sortChampionships(championships: readonly string[]): string[] {
  return [...new Set(championships)].sort((a, b) => {
    if (a === REGOLARI) return -1;
    if (b === REGOLARI) return 1;
    return a.localeCompare(b);
  });
}

/** Appartenenza di una squadra al campionato indicato. */
export function membership(championship: string, teamId: AnyColumn = team.id): SQL {
  return and(
    eq(teamChampionship.teamId, teamId),
    eq(teamChampionship.championship, championship),
  ) as SQL;
}

/**
 * Solo il campionato regolare disputa la finale: per tutti gli altri i round
 * `final` vanno esclusi dalle classifiche e dalle pagine.
 */
export function finalOnlyRegular(championship: string): SQL | undefined {
  return championship === REGOLARI ? undefined : ne(round.slug, "final");
}

/**
 * Vero se il campionato ha segnato almeno un punteggio nel round: è il modo in
 * cui le classifiche decidono quali round appartengono a quale campionato (le
 * squadre esordienti delle OIS 16/17 sono iscritte anche ai round regolari, ma
 * non vi hanno gareggiato).
 */
export function championshipScoredInRound(
  championship: string,
  roundId: AnyColumn = round.id,
): SQL {
  return sql`exists (
    select 1
    from team_task_score s
    join task t on t.id = s.task_id
    join team tm on tm.id = s.team_id
    join team_championship tc on tc.team_id = tm.id
    where t.round_id = ${roundId}
      and tc.championship = ${championship}
      and tm.hidden = false
  )`;
}

/**
 * Formatta un punteggio nei testi descrittivi: al massimo due decimali, senza
 * zeri in coda.
 */
export function formatScore(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

const tableScoreFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  useGrouping: false,
});

/**
 * I punteggi nelle classifiche non mostrano mai più di un decimale (e niente
 * separatori delle migliaia, per non allargare le colonne).
 */
export function formatTableScore(value: number | null | undefined): string {
  if (value == null) return "";
  return tableScoreFormat.format(value);
}

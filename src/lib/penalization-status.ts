export type PenalizationAppealStatus =
  | "Finestra ricorsi aperta"
  | "Finestra dei ricorsi chiusa"
  | "Ricorso approvato"
  | "Ricorso rigettato"
  | "Non appellabile";

export function getPenalizationAppealStatus(item: {
  appealAllowed?: boolean | null;
  allowAppealUntil?: Date | null;
  appealApproved?: boolean | null;
}): PenalizationAppealStatus {
  if (item.appealApproved === true) {
    return "Ricorso approvato";
  }
  if (item.appealApproved === false) {
    return "Ricorso rigettato";
  }
  if (!item.appealAllowed) {
    return "Non appellabile";
  }
  if (item.allowAppealUntil && new Date(item.allowAppealUntil) >= new Date()) {
    return "Finestra ricorsi aperta";
  }
  return "Finestra dei ricorsi chiusa";
}

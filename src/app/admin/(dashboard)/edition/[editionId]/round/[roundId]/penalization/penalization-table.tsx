"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Button } from "@olinfo/react-components";
import clsx from "clsx";
import { Check, X } from "lucide-react";

import { Modal } from "~/components/modal";
import { Table } from "~/components/table";
import type { RoundPenalization } from "~/lib/penalization";

import { reviewAppeal } from "./actions";
import { PenalizationModalButton } from "./penalization-modal-button";

const levelLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const levelBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

const typeLabel = {
  proctoring: "Proctoring",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Codice d'onore",
} as const;

/**
 * TODO: riattivare la revisione dei ricorsi.
 * Disabilitata temporaneamente: i pulsanti restano visibili ma non cliccabili.
 */
const APPEAL_REVIEW_DISABLED = true;

function AppealReviewButtons({
  editionId,
  roundSlug,
  item,
  isEmailSent,
}: {
  editionId: string;
  roundSlug: string;
  item: RoundPenalization;
  isEmailSent: boolean;
}) {
  const router = useRouter();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [targetAction, setTargetAction] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  if (!item.appealAllowed && item.appealApproved === null) {
    return <span className="italic opacity-50">-</span>;
  }

  function openConfirm(approved: boolean) {
    setTargetAction(approved);
    modalRef.current?.showModal();
  }

  async function handleConfirm() {
    if (targetAction === null) return;
    setPending(true);
    try {
      await reviewAppeal(editionId, roundSlug, item.id, targetAction);
      modalRef.current?.close();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const isApproved = item.appealApproved === true;
  const isRejected = item.appealApproved === false;
  const blocked = APPEAL_REVIEW_DISABLED || !isEmailSent;
  const blockedReason = APPEAL_REVIEW_DISABLED
    ? "Gestione ricorsi temporaneamente disabilitata"
    : "Email non inviata all'istituto";

  return (
    <>
      <div className="flex flex-wrap gap-1.5 justify-center items-center">
        <button
          type="button"
          onClick={() => !isApproved && openConfirm(true)}
          disabled={blocked || pending}
          className={clsx(
            "size-6 rounded flex items-center justify-center border transition-all",
            blocked
              ? "border-success/30 text-success/40 cursor-not-allowed opacity-40"
              : isApproved
                ? "bg-success border-success text-white cursor-default shadow-sm ring-2 ring-success/30"
                : "border-success text-success hover:bg-success hover:text-white cursor-pointer",
          )}
          title={
            blocked
              ? blockedReason
              : isApproved
                ? "Ricorso approvato"
                : isRejected
                  ? "Modifica esito: Approva ricorso"
                  : "Approva ricorso"
          }>
          <Check className="size-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => !isRejected && openConfirm(false)}
          disabled={blocked || pending}
          className={clsx(
            "size-6 rounded flex items-center justify-center border transition-all",
            blocked
              ? "border-error/30 text-error/40 cursor-not-allowed opacity-40"
              : isRejected
                ? "bg-error border-error text-white cursor-default shadow-sm ring-2 ring-error/30"
                : "border-error text-error hover:bg-error hover:text-white cursor-pointer",
          )}
          title={
            blocked
              ? blockedReason
              : isRejected
                ? "Ricorso rigettato"
                : isApproved
                  ? "Modifica esito: Rigetta ricorso"
                  : "Rigetta ricorso"
          }>
          <X className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      <Modal ref={modalRef} title={targetAction === true ? "Approva ricorso" : "Rigetta ricorso"}>
        <p>
          {targetAction === true
            ? `Sei sicuro di voler approvare il ricorso per la penalizzazione dei team ${item.teams}? La penalizzazione verrà annullata.`
            : `Sei sicuro di voler rigettare il ricorso per la penalizzazione dei team ${item.teams}? La penalizzazione verrà convertita a livello rosso.`}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            className="btn-ghost btn-sm"
            onClick={() => modalRef.current?.close()}
            disabled={pending}>
            Annulla
          </Button>
          <Button
            className={clsx("btn-sm", targetAction ? "btn-success" : "btn-error")}
            onClick={handleConfirm}
            disabled={pending}>
            {targetAction ? "Approva" : "Rigetta"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function PenalizationRow({
  item,
  editionId,
  roundId,
}: {
  item: RoundPenalization;
  editionId: string;
  roundId: string;
}) {
  const isEmailSent = item.sentAt !== null;

  return (
    <>
      <div>{item.teams}</div>
      <div className="text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className={`badge badge-sm ${levelBadge[item.level]}`}>{levelLabel[item.level]}</span>
        {item.appealAllowed ? (
          <span className="badge badge-sm badge-info">Appellabile</span>
        ) : (
          <span className="badge badge-sm badge-error">Non appellabile</span>
        )}
      </div>
      <div>
        <span className="badge badge-sm badge-outline">{typeLabel[item.type]}</span>
      </div>
      <div className="text-wrap break-words">{item.description}</div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/penalization/${item.id}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
        <PenalizationModalButton
          editionId={editionId}
          roundId={roundId}
          label="Modifica"
          penalization={{
            id: item.id,
            level: item.level,
            appealAllowed: item.appealAllowed,
            description: item.description,
          }}
        />
      </div>
      <div>
        <AppealReviewButtons
          editionId={editionId}
          roundSlug={roundId}
          item={item}
          isEmailSent={isEmailSent}
        />
      </div>
    </>
  );
}

export function PenalizationTable({
  penalization,
  editionId,
  roundId,
}: {
  penalization: RoundPenalization[];
  editionId: string;
  roundId: string;
}) {
  const itemMatch = useCallback(
    (search: string, item: RoundPenalization) =>
      item.teams.toLowerCase().includes(search) ||
      item.instituteName?.toLowerCase().includes(search) ||
      item.instituteCity?.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search),
    [],
  );

  const Row = useCallback(
    ({ item }: { item: RoundPenalization }) => (
      <PenalizationRow item={item} editionId={editionId} roundId={roundId} />
    ),
    [editionId, roundId],
  );

  return (
    <Table
      data={penalization}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={Row}
      className="grid-cols-[repeat(7,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Team</div>
      <div>Istituto</div>
      <div>Livello</div>
      <div>Tipo</div>
      <div>Descrizione</div>
      <div>Azioni</div>
      <div>Ricorso</div>
    </>
  );
}

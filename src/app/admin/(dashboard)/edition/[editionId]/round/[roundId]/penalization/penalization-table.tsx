"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Button } from "@olinfo/react-components";
import clsx from "clsx";
import { Check, X } from "lucide-react";

import { Modal } from "~/components/modal";
import { Table } from "~/components/table";
import type { RoundPenalizationEmail } from "~/lib/email";
import type { RoundPenalization } from "~/lib/penalization";

import { reviewAppeal, sendPenalizationEmail } from "./actions";

const levelLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const levelBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

const typeLabel = {
  "screen-recording": "Screen recording",
  "internet-check": "Internet",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Violazione del codice d'onore",
} as const;

function EmailPreviewModal({ emailId }: { emailId: number | null }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const src = emailId ? `/admin/api/email/${emailId}` : null;

  return (
    <>
      <Button
        className="btn-xs btn-outline"
        onClick={() => modalRef.current?.showModal()}
        disabled={!src}>
        Visualizza
      </Button>
      <Modal ref={modalRef} title="Anteprima email">
        {src && <iframe src={src} className="w-full h-96 border rounded" title="Anteprima email" />}
      </Modal>
    </>
  );
}

function SendEmailButton({
  editionId,
  roundId,
  instituteId,
  status,
}: {
  editionId: string;
  roundId: string;
  instituteId: string;
  status: string;
}) {
  const router = useRouter();
  const disabled = status === "sending";

  async function handleSend() {
    await sendPenalizationEmail(editionId, roundId, instituteId);
    router.refresh();
  }

  return (
    <Button className="btn-xs btn-primary" onClick={handleSend} disabled={disabled}>
      {status === "sent" ? "Reinvia email" : "Invia email"}
    </Button>
  );
}

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

  return (
    <>
      <div className="flex flex-wrap gap-1.5 justify-center items-center">
        <button
          type="button"
          onClick={() => !isApproved && openConfirm(true)}
          disabled={!isEmailSent || pending}
          className={clsx(
            "size-6 rounded flex items-center justify-center border transition-all",
            isEmailSent
              ? isApproved
                ? "bg-success border-success text-white cursor-default shadow-sm ring-2 ring-success/30"
                : "border-success text-success hover:bg-success hover:text-white cursor-pointer"
              : "border-success/30 text-success/40 cursor-not-allowed opacity-40",
          )}
          title={
            isEmailSent
              ? isApproved
                ? "Ricorso approvato"
                : isRejected
                  ? "Modifica esito: Approva ricorso"
                  : "Approva ricorso"
              : "Email non inviata all'istituto"
          }>
          <Check className="size-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => !isRejected && openConfirm(false)}
          disabled={!isEmailSent || pending}
          className={clsx(
            "size-6 rounded flex items-center justify-center border transition-all",
            isEmailSent
              ? isRejected
                ? "bg-error border-error text-white cursor-default shadow-sm ring-2 ring-error/30"
                : "border-error text-error hover:bg-error hover:text-white cursor-pointer"
              : "border-error/30 text-error/40 cursor-not-allowed opacity-40",
          )}
          title={
            isEmailSent
              ? isRejected
                ? "Ricorso rigettato"
                : isApproved
                  ? "Modifica esito: Rigetta ricorso"
                  : "Rigetta ricorso"
              : "Email non inviata all'istituto"
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
  emailStatuses,
  editionId,
  roundId,
}: {
  item: RoundPenalization;
  emailStatuses: RoundPenalizationEmail[];
  editionId: string;
  roundId: string;
}) {
  const emailStatus = emailStatuses.find((e) => e.instituteId === item.instituteId);
  const isEmailSent = emailStatus?.status === "sent" || item.sentAt !== null;

  return (
    <>
      <div>{item.teams}</div>
      <div className="text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div>
        <span className={`badge badge-sm ${levelBadge[item.level]}`}>{levelLabel[item.level]}</span>
      </div>
      <div>
        <span className="badge badge-sm badge-outline">{typeLabel[item.type]}</span>
      </div>
      <div className="text-wrap break-words">{item.description}</div>
      <div className="flex flex-wrap gap-1 justify-center">
        {emailStatus ? (
          <>
            <SendEmailButton
              editionId={editionId}
              roundId={roundId}
              instituteId={emailStatus.instituteId}
              status={emailStatus.status}
            />
            <EmailPreviewModal emailId={emailStatus.emailId} />
          </>
        ) : (
          <span className="italic opacity-50">-</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/penalization/${item.id}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
        <Button className="btn-primary btn-xs">Modifica</Button>
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
  emailStatuses,
  editionId,
  roundId,
}: {
  penalization: RoundPenalization[];
  emailStatuses: RoundPenalizationEmail[];
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
      <PenalizationRow
        item={item}
        emailStatuses={emailStatuses}
        editionId={editionId}
        roundId={roundId}
      />
    ),
    [emailStatuses, editionId, roundId],
  );

  return (
    <Table
      data={penalization}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={Row}
      className="grid-cols-[repeat(8,auto)]"
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
      <div>Email</div>
      <div>Azioni</div>
      <div>Ricorso</div>
    </>
  );
}

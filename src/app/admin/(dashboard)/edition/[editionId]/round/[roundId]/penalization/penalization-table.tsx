"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { Button } from "@olinfo/react-components";

import { Modal } from "~/components/modal";
import { Table } from "~/components/table";
import type { RoundPenalizationEmail } from "~/lib/email";
import type { RoundPenalization } from "~/lib/penalization";

import { sendPenalizationEmail } from "./actions";

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
  const disabled = status === "sent" || status === "sending";

  async function handleSend() {
    await sendPenalizationEmail(editionId, roundId, instituteId);
    router.refresh();
  }

  return (
    <Button className="btn-xs btn-primary" onClick={handleSend} disabled={disabled}>
      Invia email
    </Button>
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
        {emailStatus && (
          <>
            <SendEmailButton
              editionId={editionId}
              roundId={roundId}
              instituteId={emailStatus.instituteId}
              status={emailStatus.status}
            />
            <EmailPreviewModal emailId={emailStatus.emailId} />
          </>
        )}
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/penalization/${item.id}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
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
    </>
  );
}

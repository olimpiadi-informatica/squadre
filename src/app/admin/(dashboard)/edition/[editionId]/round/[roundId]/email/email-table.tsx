"use client";

import { useCallback, useRef } from "react";

import { Button } from "@olinfo/react-components";

import { Modal } from "~/components/modal";
import { Table } from "~/components/table";
import type { RoundEmail, RoundEmailStatus } from "~/lib/email";

import { sendEmail } from "./actions";

type Props = {
  statuses: RoundEmail[];
  editionId: string;
  roundId: string;
};

const statusLabel: Record<RoundEmailStatus, string> = {
  "not-sent": "Non inviata",
  sending: "In corso",
  sent: "Inviata",
  "sending-failed": "Errore",
};

const statusBadge: Record<RoundEmailStatus, string> = {
  "not-sent": "badge-neutral",
  sending: "badge-warning",
  sent: "badge-success",
  "sending-failed": "badge-error",
};

function PreviewModalButton({
  emailId,
  instituteId,
  editionId,
  roundId,
}: {
  emailId: number | null;
  instituteId: string;
  editionId: string;
  roundId: string;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button className="btn-ghost btn-xs" onClick={() => modalRef.current?.showModal()}>
        Visualizza
      </Button>
      <Modal ref={modalRef} title="Anteprima email">
        <div className="h-[70vh]">
          <iframe
            src={
              emailId === null
                ? `/admin/api/email/preview?editionId=${editionId}&roundId=${roundId}&instituteId=${instituteId}`
                : `/admin/api/email/${emailId}`
            }
            className="size-full rounded"
            title="Anteprima email"
          />
        </div>
      </Modal>
    </>
  );
}

function EmailRow({
  item,
  editionId,
  roundId,
}: {
  item: RoundEmail;
  editionId: string;
  roundId: string;
}) {
  return (
    <>
      <div>
        {item.instituteName}, {item.instituteCity}
      </div>
      <div className="text-sm opacity-70">
        {item.address ?? <span className="italic opacity-50">-</span>}
      </div>
      <div>
        <span className={`badge badge-sm ${statusBadge[item.status]}`}>
          {statusLabel[item.status]}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        <Button
          className="btn-primary btn-xs"
          onClick={() => sendEmail(editionId, roundId, item.instituteId)}
          disabled={item.status !== "not-sent" && item.status !== "sending-failed"}>
          Invia
        </Button>
        <PreviewModalButton
          emailId={item.emailId}
          instituteId={item.instituteId}
          editionId={editionId}
          roundId={roundId}
        />
      </div>
    </>
  );
}

export function EmailTable({ statuses, editionId, roundId }: Props) {
  const itemMatch = useCallback(
    (search: string, status: RoundEmail) =>
      status.instituteName.toLowerCase().includes(search) ||
      (status.address?.toLowerCase().includes(search) ?? false),
    [],
  );

  return (
    <Table
      data={statuses}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={(props) => <EmailRow {...props} editionId={editionId} roundId={roundId} />}
      className="grid-cols-[repeat(4,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Istituto</div>
      <div>Indirizzo email</div>
      <div>Status</div>
      <div>Azioni</div>
    </>
  );
}

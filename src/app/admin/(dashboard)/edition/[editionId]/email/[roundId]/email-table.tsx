"use client";

import { useCallback, useTransition } from "react";

import { Button } from "@olinfo/react-components";

import { Table } from "~/components/table";
import type { RoundEmail, RoundEmailStatus } from "~/lib/email";

import { sendAllEmails, sendEmail } from "./actions";

type Props = {
  statuses: RoundEmail[];
  editionId: string;
  roundId: string;
};

const statusLabel: Record<RoundEmailStatus, string> = {
  "not-sent": "Non inviata",
  sending: "In invio...",
  sent: "Inviata",
  "sending-failed": "Errore invio",
};

const statusClass: Record<RoundEmailStatus, string> = {
  "not-sent": "badge-ghost",
  sending: "badge-info",
  sent: "badge-success",
  "sending-failed": "badge-error",
};

function StatusBadge({ status }: { status: RoundEmailStatus }) {
  return (
    <span className={`badge badge-sm font-medium ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
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
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      await sendEmail(editionId, roundId, item.instituteId);
    });
  }

  return (
    <>
      <div>
        {item.instituteName}, {item.instituteCity}
      </div>
      <div className="text-sm opacity-70">
        {item.address ?? <span className="italic opacity-50">-</span>}
      </div>
      <div>
        <StatusBadge status={isPending ? "sending" : item.status} />
      </div>
      <div>
        <Button
          onClick={handleSend}
          disabled={isPending || item.status === "sending"}
          className="btn-primary btn-xs">
          Invia
        </Button>
      </div>
    </>
  );
}

export function EmailTable({ statuses, editionId, roundId }: Props) {
  const [isSendingAll, startSendAll] = useTransition();

  const itemMatch = useCallback(
    (search: string, status: RoundEmail) =>
      status.instituteName.toLowerCase().includes(search) ||
      (status.address?.toLowerCase().includes(search) ?? false),
    [],
  );

  function handleSendAll() {
    startSendAll(async () => {
      await sendAllEmails(editionId, roundId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleSendAll} disabled={isSendingAll} className="btn-primary">
          {isSendingAll ? "Invio in corso..." : "Invia a tutti"}
        </Button>
      </div>
      <Table
        data={statuses}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={(props) => <EmailRow {...props} editionId={editionId} roundId={roundId} />}
        className="grid-cols-[repeat(4,auto)]"
      />
    </div>
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

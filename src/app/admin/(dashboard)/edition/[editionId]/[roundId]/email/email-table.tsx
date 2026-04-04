"use client";

import { useCallback, useRef, useState } from "react";

import { Button, Modal } from "@olinfo/react-components";

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

function EmailRow({
  item,
  editionId,
  roundId,
  onPreview,
}: {
  item: RoundEmail;
  editionId: string;
  roundId: string;
  onPreview: (emailId: number | null, instituteId: string) => void;
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
        <Button
          className="btn-ghost btn-xs"
          onClick={() => onPreview(item.emailId, item.instituteId)}>
          Visualizza
        </Button>
      </div>
    </>
  );
}

export function EmailTable({ statuses, editionId, roundId }: Props) {
  const previewModalRef = useRef<HTMLDialogElement>(null);
  const [previewEmailId, setPreviewEmailId] = useState<number | null>(null);
  const [previewInstituteId, setPreviewInstituteId] = useState<string | null>(null);

  const itemMatch = useCallback(
    (search: string, status: RoundEmail) =>
      status.instituteName.toLowerCase().includes(search) ||
      (status.address?.toLowerCase().includes(search) ?? false),
    [],
  );

  function handlePreview(emailId: number | null, instituteId: string) {
    setPreviewEmailId(emailId);
    setPreviewInstituteId(instituteId);
    previewModalRef.current?.showModal();
  }

  return (
    <>
      <Table
        data={statuses}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={(props) => (
          <EmailRow {...props} editionId={editionId} roundId={roundId} onPreview={handlePreview} />
        )}
        className="grid-cols-[repeat(4,auto)]"
      />

      {/* Preview modal */}
      <Modal ref={previewModalRef} title="Anteprima email">
        <div className="h-[70vh]">
          {previewInstituteId !== null && (
            <iframe
              src={
                previewEmailId === null
                  ? `/admin/api/email/preview?editionId=${editionId}&roundId=${roundId}&instituteId=${previewInstituteId}`
                  : `/admin/api/email/${previewEmailId}`
              }
              className="size-full rounded"
              title="Anteprima email"
            />
          )}
        </div>
      </Modal>
    </>
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

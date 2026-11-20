"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Button } from "@olinfo/react-components";
import { format } from "date-fns";

import { Modal } from "~/components/modal";
import { Table } from "~/components/table";
import type { PenalizationLevel, PenalizationType } from "~/lib/db/schema";
import type { RoundEmailStatus, RoundPenalizationEmailGroup } from "~/lib/email";

import { sendPenalizationEmail } from "./actions";

const statusLabel: Record<RoundEmailStatus, string> = {
  "not-sent": "Mai inviata",
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

const levelLabel: Record<PenalizationLevel, string> = {
  yellow: "Gialla",
  red: "Rossa",
};

const levelBadge: Record<PenalizationLevel, string> = {
  yellow: "badge-warning",
  red: "badge-error",
};

const typeLabel: Record<PenalizationType, string> = {
  proctoring: "Proctoring",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Violazione del codice d'onore",
};

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function LevelBreakdown({ yellow, red }: { yellow: number; red: number }) {
  if (yellow === 0 && red === 0) return null;

  return (
    <>
      {yellow > 0 && (
        <span
          className="badge badge-warning badge-sm"
          title={pluralize(yellow, "gialla", "gialle")}>
          {yellow}
        </span>
      )}
      {red > 0 && (
        <span className="badge badge-error badge-sm" title={pluralize(red, "rossa", "rosse")}>
          {red}
        </span>
      )}
    </>
  );
}

function EmailPreviewButton({
  editionId,
  roundId,
  instituteId,
  emailId,
  pending,
}: {
  editionId: string;
  roundId: string;
  instituteId: string;
  emailId: number | null;
  pending: boolean;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const src =
    pending || !emailId
      ? `/admin/api/email/penalization-preview?editionId=${encodeURIComponent(editionId)}&roundId=${encodeURIComponent(roundId)}&instituteId=${encodeURIComponent(instituteId)}`
      : `/admin/api/email/${emailId}`;

  return (
    <>
      <span
        title={pending ? "Anteprima della prossima email" : "Anteprima dell'ultima email inviata"}>
        <Button className="btn-ghost btn-xs" onClick={() => modalRef.current?.showModal()}>
          Visualizza
        </Button>
      </span>
      <Modal ref={modalRef} title="Anteprima email">
        <iframe src={src} className="w-full h-96 border rounded" title="Anteprima email" />
      </Modal>
    </>
  );
}

function EmailHistoryButton({ group }: { group: RoundPenalizationEmailGroup }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [previewEmailId, setPreviewEmailId] = useState<number | null>(null);

  if (group.emails.length === 0) return null;

  return (
    <>
      <Button className="btn-ghost btn-xs" onClick={() => modalRef.current?.showModal()}>
        Cronologia
      </Button>
      <Modal ref={modalRef} title={`Email inviate a ${group.instituteName}`}>
        <ul className="flex flex-col gap-3">
          {group.emails.map((email) => (
            <li key={email.emailId} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">{format(email.createdAt, "dd/MM/yyyy HH:mm")}</span>
                  <span className="text-xs opacity-70">{email.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge badge-sm ${statusBadge[email.status]}`}>
                    {statusLabel[email.status]}
                  </span>
                  <Button
                    className="btn-ghost btn-xs"
                    onClick={() =>
                      setPreviewEmailId((current) =>
                        current === email.emailId ? null : email.emailId,
                      )
                    }>
                    {previewEmailId === email.emailId ? "Chiudi" : "Visualizza"}
                  </Button>
                </div>
              </div>
              {previewEmailId === email.emailId && (
                <iframe
                  src={`/admin/api/email/${email.emailId}`}
                  className="w-full h-96 border rounded"
                  title="Anteprima email"
                />
              )}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

function PenalizationDetailsButton({ group }: { group: RoundPenalizationEmailGroup }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button className="btn-primary btn-xs" onClick={() => modalRef.current?.showModal()}>
        Dettagli
      </Button>
      <Modal ref={modalRef} title={`Penalizzazioni di ${group.instituteName}`}>
        <div className="max-h-[70vh] overflow-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Team</th>
                <th>Livello</th>
                <th>Tipo</th>
                <th>Descrizione</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {group.penalizations.map((penalization) => (
                <tr key={penalization.id}>
                  <td className="whitespace-nowrap">{penalization.teams}</td>
                  <td>
                    <span className={`badge badge-sm ${levelBadge[penalization.level]}`}>
                      {levelLabel[penalization.level]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{typeLabel[penalization.type]}</td>
                  <td className="min-w-64 whitespace-normal">{penalization.description}</td>
                  <td>
                    {penalization.sent ? (
                      <span className="badge badge-sm badge-success">Inviata</span>
                    ) : (
                      <span className="badge badge-sm badge-warning text-nowrap">Da inviare</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}

function SendEmailButton({
  editionId,
  roundId,
  group,
  sendingClosed,
}: {
  editionId: string;
  roundId: string;
  group: RoundPenalizationEmailGroup;
  sendingClosed?: boolean;
}) {
  const router = useRouter();
  const latest = group.emails[0];
  const disabled = sendingClosed || group.pendingCount === 0 || latest?.status === "sending";

  async function handleSend() {
    await sendPenalizationEmail(editionId, roundId, group.instituteId);
    router.refresh();
  }

  return (
    <Button className="btn-primary btn-xs" onClick={handleSend} disabled={disabled}>
      {group.emails.length > 0 ? "Invia nuove" : "Invia"}
    </Button>
  );
}

function PenalizationEmailRow({
  group,
  editionId,
  roundId,
  sendingClosed,
}: {
  group: RoundPenalizationEmailGroup;
  editionId: string;
  roundId: string;
  sendingClosed?: boolean;
}) {
  const latest = group.emails[0];

  return (
    <>
      <div className="text-wrap break-words">
        {group.instituteName}, {group.instituteCity}
      </div>
      <div className="text-wrap break-words text-sm opacity-70">
        {group.address ?? <span className="italic opacity-50">-</span>}
      </div>
      <div className="flex flex-nowrap items-center gap-1">
        <LevelBreakdown yellow={group.yellowCount} red={group.redCount} />
      </div>
      <div className="flex flex-nowrap items-center gap-1">
        {group.pendingCount > 0 ? (
          <LevelBreakdown yellow={group.pendingYellowCount} red={group.pendingRedCount} />
        ) : (
          <span className="italic opacity-50">-</span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <div className="flex flex-col items-start gap-1">
          <SendEmailButton
            editionId={editionId}
            roundId={roundId}
            group={group}
            sendingClosed={sendingClosed}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <PenalizationDetailsButton group={group} />
          <EmailPreviewButton
            editionId={editionId}
            roundId={roundId}
            instituteId={group.instituteId}
            emailId={latest?.emailId ?? null}
            pending={group.pendingCount > 0}
          />
          <EmailHistoryButton group={group} />
        </div>
      </div>
    </>
  );
}

export function PenalizationEmailTable({
  groups,
  editionId,
  roundId,
  sendingClosed,
}: {
  groups: RoundPenalizationEmailGroup[];
  editionId: string;
  roundId: string;
  sendingClosed?: boolean;
}) {
  const itemMatch = useCallback(
    (search: string, group: RoundPenalizationEmailGroup) =>
      group.instituteName.toLowerCase().includes(search) ||
      group.instituteCity.toLowerCase().includes(search) ||
      (group.address?.toLowerCase().includes(search) ?? false) ||
      statusLabel[group.pendingCount > 0 ? "not-sent" : (group.emails[0]?.status ?? "not-sent")]
        .toLowerCase()
        .includes(search),
    [],
  );

  const Row = useCallback(
    ({ item }: { item: RoundPenalizationEmailGroup }) => (
      <PenalizationEmailRow
        group={item}
        editionId={editionId}
        roundId={roundId}
        sendingClosed={sendingClosed}
      />
    ),
    [editionId, roundId, sendingClosed],
  );

  return (
    <Table
      data={groups}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={Row}
      className="grid-cols-[repeat(5,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Istituto</div>
      <div>Indirizzo email</div>
      <div title="Quante gialle e quante rosse">Penalizzazioni</div>
      <div title="Quante gialle e quante rosse da inviare">Da inviare</div>
      <div>Azioni</div>
    </>
  );
}

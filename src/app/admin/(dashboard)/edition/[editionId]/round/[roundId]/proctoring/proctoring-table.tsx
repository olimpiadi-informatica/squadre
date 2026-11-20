"use client";

import Link from "next/link";
import { useCallback } from "react";

import clsx from "clsx";

import { Table } from "~/components/table";
import { formatTableScore } from "~/lib/format";
import type { ProctoringTeamRow } from "~/lib/proctoring";

import { PenalizationModalButton } from "../penalization/penalization-modal-button";

const MISSING_WARNING_MS = 30 * 60_000;

const penalizationLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const penalizationBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

function formatDuration(ms: number) {
  const totalMinutes = Math.max(Math.round(ms / 60_000), 1);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function ProctoringRow({
  item,
  editionId,
  roundId,
}: {
  item: ProctoringTeamRow;
  editionId: string;
  roundId: string;
}) {
  return (
    <>
      <div>{item.teamSlug}</div>
      <div className="text-wrap break-words">{item.teamName}</div>
      <div className="text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div>{formatTableScore(item.score)}</div>
      <div className={clsx(item.numPc > 2 && "font-semibold text-error")}>{item.numPc}</div>
      <div>
        {item.penalization ? (
          <span className={clsx("badge badge-sm", penalizationBadge[item.penalization])}>
            {penalizationLabel[item.penalization]}
          </span>
        ) : (
          <span className="opacity-60">-</span>
        )}
      </div>
      <div>
        {item.internet && item.internet.numChecks > 0 ? (
          <>
            <div>
              {item.internet.numSucceededChecks} / {item.internet.numChecks}
            </div>
            <div className="text-xs opacity-70">
              <span className={clsx(item.internet.numFailedChecks > 0 && "text-error")}>
                fail {item.internet.numFailedChecks}
              </span>
              <span> · </span>
              <span className={clsx(item.internet.numMissingChecks > 0 && "text-warning")}>
                missing {item.internet.numMissingChecks}
              </span>
            </div>
          </>
        ) : (
          <span className="opacity-60">-</span>
        )}
      </div>
      <div>
        {item.recording && item.recording.numSessions > 0 ? (
          <>
            <div>{item.recording.totalFrames} frame</div>
            <div className="text-xs leading-tight opacity-70">
              <span
                className={clsx(
                  item.recording.missingMs >= MISSING_WARNING_MS
                    ? "text-error"
                    : item.recording.missingMs > 0
                      ? "text-warning"
                      : undefined,
                )}>
                missing{" "}
                {item.recording.missingMs > 0 ? formatDuration(item.recording.missingMs) : "0"}
              </span>
            </div>
            {item.recording.numMissingPcs > 0 && (
              <div className="whitespace-normal text-xs leading-tight text-error">
                {item.recording.numMissingPcs} PC senza registrazione
              </div>
            )}
          </>
        ) : (
          <span className="whitespace-normal text-xs leading-tight text-error">
            Nessuna registrazione
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <Link
          href={`/admin/edition/${editionId}/round/${roundId}/proctoring/${item.teamSlug}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
        <PenalizationModalButton
          editionId={editionId}
          roundId={roundId}
          teamSlug={item.teamSlug}
          disabled={item.penalization !== null}
          title={
            item.penalization === null ? undefined : "Esiste già una penalizzazione di proctoring"
          }
        />
      </div>
    </>
  );
}

export function ProctoringTable({
  rows,
  editionId,
  roundId,
}: {
  rows: ProctoringTeamRow[];
  editionId: string;
  roundId: string;
}) {
  const itemMatch = useCallback(
    (search: string, item: ProctoringTeamRow) =>
      item.teamSlug.toLowerCase().includes(search) ||
      item.teamName.toLowerCase().includes(search) ||
      item.instituteName.toLowerCase().includes(search) ||
      item.instituteCity.toLowerCase().includes(search),
    [],
  );

  const Row = useCallback(
    ({ item }: { item: ProctoringTeamRow }) => (
      <ProctoringRow item={item} editionId={editionId} roundId={roundId} />
    ),
    [editionId, roundId],
  );

  return (
    <Table
      data={rows}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={Row}
      className="grid-cols-[repeat(9,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div className="min-w-20">Username</div>
      <div className="min-w-32">Nome</div>
      <div className="min-w-48">Istituto</div>
      <div className="min-w-16">Punteggio</div>
      <div className="min-w-10">PC</div>
      <div className="min-w-24">Penalizzato</div>
      <div className="min-w-28">Internet</div>
      <div className="min-w-36">Screenshot</div>
      <div className="min-w-20">Azioni</div>
    </>
  );
}

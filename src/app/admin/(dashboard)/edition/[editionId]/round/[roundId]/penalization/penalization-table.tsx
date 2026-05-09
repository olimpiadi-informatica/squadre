"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Table } from "~/components/table";
import type { RoundPenalization } from "~/lib/penalization";

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

function PenalizationRow({ item }: { item: RoundPenalization }) {
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
      <div>
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/penalization/${item.id}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
      </div>
    </>
  );
}

export function PenalizationTable({ penalization }: { penalization: RoundPenalization[] }) {
  const itemMatch = useCallback(
    (search: string, item: RoundPenalization) =>
      item.teams.toLowerCase().includes(search) ||
      item.instituteName?.toLowerCase().includes(search) ||
      item.instituteCity?.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search),
    [],
  );

  return (
    <Table
      data={penalization}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={PenalizationRow}
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
      <div />
    </>
  );
}

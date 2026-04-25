"use client";

import { useCallback } from "react";

import { intlFormat } from "date-fns";

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
  "internet-check": "Controllo internet",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Violazione del codice d'onore",
} as const;

function PenalizationRow({ item }: { item: RoundPenalization }) {
  return (
    <>
      <div className="min-w-40">
        <div className="font-mono text-xs opacity-70">{item.teamSlug}</div>
        <div className="text-wrap break-words">{item.teamName}</div>
      </div>
      <div className="min-w-48 text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div>
        <span className={`badge badge-sm ${levelBadge[item.level]}`}>{levelLabel[item.level]}</span>
      </div>
      <div>
        <span className="badge badge-sm badge-outline">{typeLabel[item.type]}</span>
      </div>
      <div className="text-sm whitespace-nowrap">
        {intlFormat(
          item.createdAt,
          { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" },
          { locale: "it-IT" },
        )}
      </div>
      <div className="min-w-96 text-wrap break-words">{item.description}</div>
    </>
  );
}

export function PenalizationTable({ penalization }: { penalization: RoundPenalization[] }) {
  const itemMatch = useCallback(
    (search: string, item: RoundPenalization) =>
      item.teamSlug.toLowerCase().includes(search) ||
      item.teamName.toLowerCase().includes(search) ||
      item.instituteName.toLowerCase().includes(search) ||
      item.instituteCity.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search),
    [],
  );

  return (
    <Table
      data={penalization}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={PenalizationRow}
      className="grid-cols-[auto_auto_auto_auto_auto_minmax(28rem,1fr)]"
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
      <div>Data</div>
      <div>Descrizione</div>
    </>
  );
}

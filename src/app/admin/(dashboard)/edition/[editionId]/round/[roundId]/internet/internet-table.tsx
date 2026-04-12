"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Table } from "~/components/table";
import type { TeamRoundInternetCheck } from "~/lib/internet-check";

function InternetTeamRoundRow({ item }: { item: TeamRoundInternetCheck }) {
  return (
    <>
      <div>{item.teamSlug}</div>
      <div className="min-w-32 text-wrap break-words">{item.teamName}</div>
      <div className="min-w-48 text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div>{item.numPc}</div>
      <div>
        {item.numSuccessChecks} / {item.numChecks}
      </div>
      <div>
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/internet/${item.teamSlug}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
      </div>
    </>
  );
}

export function InternetTable({ teams }: { teams: TeamRoundInternetCheck[] }) {
  const itemMatch = useCallback(
    (search: string, item: TeamRoundInternetCheck) =>
      item.teamSlug.toLowerCase().includes(search) ||
      item.teamName.toLowerCase().includes(search) ||
      item.instituteName.toLowerCase().includes(search) ||
      item.instituteCity.toLowerCase().includes(search),
    [],
  );

  return (
    <Table
      data={teams}
      itemMatch={itemMatch}
      header={InternetTableHeaders}
      row={InternetTeamRoundRow}
      className="grid-cols-[repeat(6,auto)]"
    />
  );
}

function InternetTableHeaders() {
  return (
    <>
      <div>Slug</div>
      <div>Team</div>
      <div>Istituto</div>
      <div>PC</div>
      <div>Check</div>
      <div>Azioni</div>
    </>
  );
}

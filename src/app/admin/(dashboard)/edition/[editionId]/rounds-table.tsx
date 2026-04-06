"use client";

import Link from "next/link";

import { intlFormat } from "date-fns";

import { Table } from "~/components/table";
import type { RoundAdminItem } from "~/lib/round";

export function AdminRoundsTable({ rounds }: { rounds: RoundAdminItem[] }) {
  return (
    <Table
      data={rounds}
      itemMatch={(search, round) => round.title.toLowerCase().includes(search)}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(6,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Titolo</div>
      <div>Data</div>
      <div>Scuole</div>
      <div>Team</div>
      <div>Task</div>
      <div>Credenziali inviate</div>
    </>
  );
}

function TableRow({ item: round }: { item: RoundAdminItem }) {
  return (
    <>
      <div>
        <Link
          href={`/admin/edition/${round.editionId}/round/${round.slug}`}
          className="link link-info font-medium">
          {round.title}
        </Link>
      </div>
      <div>
        {intlFormat(
          round.startsAt,
          { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" },
          { locale: "it-IT" },
        )}
      </div>
      <div>{round.schoolCount}</div>
      <div>{round.teamCount}</div>
      <div>{round.taskCount}</div>
      <div>
        {round.sentEmailCount} / {round.schoolCount}
      </div>
    </>
  );
}

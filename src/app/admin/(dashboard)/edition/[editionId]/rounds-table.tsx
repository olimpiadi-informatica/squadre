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
      className="grid-cols-[repeat(4,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Titolo</div>
      <div>Data</div>
      <div>Task caricati</div>
      <div>Email inviate</div>
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
      <div>{round.taskCount}</div>
      <div>{round.sentEmailCount}</div>
    </>
  );
}

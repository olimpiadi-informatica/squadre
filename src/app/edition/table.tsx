"use client";

import Link from "next/link";

import { Table } from "~/components/table";
import type { EditionItem } from "~/lib/edition";

export function EditionsTable({ editions }: { editions: EditionItem[] }) {
  return (
    <Table
      data={editions}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(7,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Edition</div>
      <div>Year</div>
      <div>Schools</div>
      <div>Teams</div>
      <div>Tasks</div>
      <div>Highest</div>
      <div>Total</div>
    </>
  );
}

function TableRow({ item: edition }: { item: EditionItem }) {
  return (
    <>
      <div>
        <Link href={`/edition/${edition.id}`} className="link">
          {edition.name}
        </Link>
      </div>
      <div>{edition.year}</div>
      <div>{edition.totalInstitutes}</div>
      <div>{edition.totalTeams}</div>
      <div>{edition.totalTasks}</div>
      <div>{edition.highestPoints}</div>
      <div>{edition.totalPoints}</div>
    </>
  );
}

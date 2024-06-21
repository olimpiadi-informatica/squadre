"use client";

import Link from "next/link";

import { Table } from "~/components/table";
import type { Editions } from "~/lib/editions";

export function EditionsTable({ editions }: { editions: Editions }) {
  return (
    <Table
      data={editions.editions}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(11,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Edition</div>
      <div>Year</div>
      <div>Regions</div>
      <div>Schools</div>
      <div>Teams</div>
      <div>Tasks</div>
      <div>Fullscore</div>
      <div>Highest</div>
      <div>Average</div>
      <div>Median</div>
      <div>Total</div>
    </>
  );
}

function TableRow({ item: edition }: { item: Editions["editions"][number] }) {
  return (
    <>
      <div>
        <Link href={`/edition/${edition.id}`} className="link">
          {edition.title}
        </Link>
      </div>
      <div>{edition.year}</div>
      <div>{edition.regions}</div>
      <div>{edition.instnum}</div>
      <div>{edition.teams}</div>
      <div>{edition.tasks}</div>
      <div>{edition.fullscore}</div>
      <div>{edition.highest}</div>
      <div>{edition.average}</div>
      <div>{edition.medpos}</div>
      <div>{edition.points}</div>
    </>
  );
}

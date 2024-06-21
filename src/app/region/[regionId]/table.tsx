"use client";

import Link from "next/link";

import { Medals } from "~/components/medal";
import { Table } from "~/components/table";
import type { Region } from "~/lib/region";

export function RegionTable({ region }: { region: Region }) {
  return (
    <Table
      data={region.institutes}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(6,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>School</div>
      <div>City</div>
      <div>Participations</div>
      <div>Teams</div>
      <div>Awards</div>
      <div>Points</div>
    </>
  );
}

function TableRow({ item: institute }: { item: Region["institutes"][number] }) {
  return (
    <>
      <div>
        <Link href={`/region/${institute.region}/${institute.id}`} className="link">
          {institute.name}
        </Link>
      </div>
      <div>{institute.city}</div>
      <div>{institute.participations.length}</div>
      <div>{institute.teams}</div>
      <Medals medals={institute.medals} />
      <div>{institute.points}</div>
    </>
  );
}

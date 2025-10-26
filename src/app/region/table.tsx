"use client";

import Link from "next/link";

import { Medals } from "~/components/medal";
import { RegionImage } from "~/components/region";
import { Table } from "~/components/table";
import type { RegionItem } from "~/lib/region";

export function RegionsTable({ regions }: { regions: RegionItem[] }) {
  return (
    <Table
      data={regions}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(6,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div />
      <div>Region</div>
      <div>Schools</div>
      <div>Teams</div>
      <div>Awards</div>
      <div>Points</div>
    </>
  );
}

function TableRow({ item: region }: { item: RegionItem }) {
  return (
    <>
      <div>
        <RegionImage id={region.id} name={region.name} />
      </div>
      <div>
        <Link href={`/region/${region.id}`} className="link">
          {region.name}
        </Link>
      </div>
      <div>{region.totalInstitutes}</div>
      <div>{region.totalTeams}</div>
      <Medals medals={region.totalMedals} />
      <div>{region.totalPoints}</div>
    </>
  );
}

"use client";

import Link from "next/link";

import { Medals } from "~/components/medal";
import { RegionImage } from "~/components/region";
import { Table } from "~/components/table";
import type { Regions } from "~/lib/regions";

export function RegionsTable({ regions }: { regions: Regions }) {
  return (
    <Table
      data={regions.regions}
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

function TableRow({ item: region }: { item: Regions["regions"][number] }) {
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
      <div>{region.instnum}</div>
      <div>{region.teams}</div>
      <Medals medals={region.medals} />
      <div>{region.points}</div>
    </>
  );
}

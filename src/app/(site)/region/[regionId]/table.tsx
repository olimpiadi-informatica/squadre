"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Medals } from "~/components/medal";
import { Table } from "~/components/table";
import type { Institute } from "~/lib/institute";

export function RegionTable({ institutes }: { institutes: Institute[] }) {
  const itemMatch = useCallback((search: string, institute: Institute) => {
    return (
      institute.name.toLowerCase().includes(search) || institute.city.toLowerCase().includes(search)
    );
  }, []);

  return (
    <Table
      data={institutes}
      itemMatch={itemMatch}
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

function TableRow({ item: institute }: { item: Institute }) {
  return (
    <>
      <div className="min-w-56 text-wrap text-sm">
        <Link href={`/region/${institute.regionId}/${institute.id}`} className="link">
          {institute.name}
        </Link>
      </div>
      <div>{institute.city}</div>
      <div>{institute.totalEditions}</div>
      <div>{institute.totalTeams}</div>
      <Medals medals={institute.totalMedals} />
      <div>{institute.totalPoints}</div>
    </>
  );
}

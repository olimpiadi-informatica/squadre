"use client";

import Link from "next/link";

import { Check } from "lucide-react";

import { Medals } from "~/components/medal";
import { Table } from "~/components/table";
import type { Institute } from "~/lib/institute";

export function InstituteTable({ institute }: { institute: Institute }) {
  return institute.editions.map((edition) => (
    <div key={edition.num}>
      <Link href={`/edition/${edition.num}`} className="link m-4 mb-2 block text-xl font-bold">
        {edition.title} ({edition.year})
      </Link>
      <Table
        data={edition.teams}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[auto_auto_1fr_1fr_auto_9rem_auto]"
      />
    </div>
  ));
}

function TableHeaders() {
  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Name</div>
      <div>Coach</div>
      <div>Finalist</div>
      <div>Awards</div>
      <div>Points</div>
    </>
  );
}

function TableRow({ item: team }: { item: Institute["editions"][number]["teams"][number] }) {
  return (
    <>
      <div>{team.rank_tot}</div>
      <div>{team.rank_reg}</div>
      <div>
        <Link href={`/edition/${team.edition}/team/${team.id}`} className="link">
          {team.name}
        </Link>
      </div>
      <div>{team.coach}</div>
      <div>{team.finalist && <Check className="inline-block stroke-success" />}</div>
      <Medals medals={team.medals} />
      <div>{team.points}</div>
    </>
  );
}

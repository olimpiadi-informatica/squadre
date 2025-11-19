"use client";

import Link from "next/link";

import { Check } from "lucide-react";

import { Medals } from "~/components/medal";
import { Table } from "~/components/table";
import type { EditionItem } from "~/lib/edition";
import type { TeamItem } from "~/lib/team";

export function InstituteTable({
  editions,
  teams,
}: {
  editions: EditionItem[];
  teams: TeamItem[];
}) {
  return editions
    .map((edition) => {
      const editionTeams = teams.filter((team) => team.editionId === edition.id);
      return [edition, editionTeams] as const;
    })
    .filter(([, teams]) => teams?.length)
    .map(([edition, teams]) => (
      <div key={edition.id}>
        <Link href={`/edition/${edition.id}`} className="link m-4 mb-2 block text-xl font-bold">
          {edition.name} ({edition.year})
        </Link>
        <Table
          data={teams ?? []}
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

function TableRow({ item: team }: { item: TeamItem }) {
  return (
    <>
      <div>{team.rank}</div>
      <div>{team.regionalRank}</div>
      <div>
        <Link href={`/edition/${team.editionId}/team/${team.id}`} className="link">
          {team.name}
        </Link>
      </div>
      <div>{team.coach}</div>
      <div>{team.finalist && <Check className="inline-block stroke-success" />}</div>
      <Medals medals={team.totalMedals} />
      <div>{team.points}</div>
    </>
  );
}

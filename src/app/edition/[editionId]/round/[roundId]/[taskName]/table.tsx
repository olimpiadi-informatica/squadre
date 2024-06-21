"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { RegionImage } from "~/components/region";
import { Table } from "~/components/table";
import type { Task } from "~/lib/task";

export function TaskTable({ task }: { task: Task }) {
  return (
    <Table
      data={task.ranking}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[3rem_1fr_1fr_3rem_3rem]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Rank</div>
      <div>Team</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Score</div>
    </>
  );
}

function TableRow({ item: team }: { item: Task["ranking"][number] }) {
  const params = useParams();

  return (
    <>
      <div>{team.rank}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/edition/${params.editionId}/team/${team.team.id}`} className="link">
          {team.team.name}
        </Link>
      </div>
      <div className="min-w-56 text-wrap text-sm">
        <Link href={`/region/${team.team.region}/${team.team.inst_id}`} className="link">
          {team.team.institute}
        </Link>
      </div>
      <div>
        <Link href={`/region/${team.team.region}`}>
          <RegionImage id={team.team.region} name={team.team.fullregion} className="inline-block" />
        </Link>
      </div>
      <div>{team.score}</div>
    </>
  );
}

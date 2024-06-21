"use client";

import Link from "next/link";

import { Medal } from "~/components/medal";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { Team } from "~/lib/team";

export function TeamTable({ team }: { team: Team }) {
  return (
    <Table
      data={team.contests}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(3,auto)_repeat(var(--cols),4rem)_4.5rem]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Round</div>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Score</div>
      <div className="col-start-5 col-end-[-1]">Tasks</div>
    </>
  );
}

function TableRow({ item: round }: { item: Team["contests"][number] }) {
  return (
    <>
      <Link href={`/edition/${round.ed_num}/round/${round.id}`} className="link">
        {round.title}
      </Link>
      <div>
        <Medal rank={round.rank_tot} teams={round.teams} />
      </div>
      <div>{round.rank_reg}</div>
      <div>{round.total}</div>
      {round.scores.map((score, i) => {
        const task = round.tasks[i];
        return (
          <Link key={i} href={`/edition/${round.ed_num}/round/${round.id}/${task.name}`}>
            <abbr title={`${task.title} (${task.name})`} className="text-black">
              <Score score={score} maxScore={100} />
            </abbr>
          </Link>
        );
      })}
    </>
  );
}

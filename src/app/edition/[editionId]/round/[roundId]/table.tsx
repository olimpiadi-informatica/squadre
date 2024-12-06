"use client";

import Link from "next/link";
import { createContext, useContext } from "react";

import { RegionImage } from "~/components/region";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { Round } from "~/lib/round";

const RoundContext = createContext<Round | undefined>(undefined);

export function RoundTable({ round }: { round: Round }) {
  return (
    <RoundContext.Provider value={round}>
      <Table
        data={round.ranking}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[repeat(5,auto)_repeat(var(--cols),4rem)_4.5rem]"
      />
    </RoundContext.Provider>
  );
}

function TableHeaders() {
  const round = useContext(RoundContext)!;
  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Teams</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Total</div>
      {round.tasks.map((task) => (
        <div key={task.name}>
          <Link
            href={`/edition/${round.ed_num}/round/${round.id}/${task.name}`}
            className="link block w-full truncate">
            {task.name}
          </Link>
        </div>
      ))}
    </>
  );
}

function TableRow({ item: team }: { item: Round["ranking"][number] }) {
  const round = useContext(RoundContext)!;

  return (
    <>
      <div>{team.rank}</div>
      <div>{team.rank_reg}</div>
      <div className="min-w-32 text-wrap break-words text-sm">
        <Link href={`/edition/${round.ed_num}/team/${team.team.id}`} className="link">
          {team.team.name}
        </Link>
      </div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/region/${team.team.region}/${team.team.inst_id}`} className="link">
          {team.team.institute}
        </Link>
      </div>
      <div>
        <Link href={`/region/${team.team.region}`}>
          <RegionImage id={team.team.region} name={team.team.fullregion} className="inline-block" />
        </Link>
      </div>
      <div>{team.total}</div>
      {team.scores.map((score, i) => (
        <Score key={i} score={score} maxScore={100} className="min-w-16" />
      ))}
    </>
  );
}

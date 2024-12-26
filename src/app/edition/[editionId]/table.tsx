"use client";

import Link from "next/link";
import { createContext, useContext } from "react";

import { Check } from "lucide-react";

import { RegionImage } from "~/components/region";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { Edition } from "~/lib/edition";

const EditionContext = createContext<Edition | undefined>(undefined);

export function EditionTable({ edition }: { edition: Edition }) {
  return (
    <EditionContext.Provider value={edition}>
      <Table
        data={edition.rounds}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[auto_auto_1fr_1fr_3rem_3rem_4rem_4rem_4rem_4rem_4.5rem]"
      />
    </EditionContext.Provider>
  );
}

function TableHeaders() {
  const edition = useContext(EditionContext)!;

  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Teams</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Total</div>
      <div>
        {edition.final ? (
          <Link href={`/edition/${edition.id}/round/final`} className="link">
            Finalist
          </Link>
        ) : (
          <>Finalist</>
        )}
      </div>
      {edition.contests.map((contest) => (
        <div key={contest.id}>
          {contest.tasks ? (
            <Link href={`/edition/${edition.id}/round/${contest.id}`} className="link">
              {contest.title}
            </Link>
          ) : (
            <>{contest.title}</>
          )}
        </div>
      ))}
    </>
  );
}

function TableRow({ item: team }: { item: Edition["rounds"][number] }) {
  const edition = useContext(EditionContext)!;

  return (
    <>
      <div>{team.rank_tot}</div>
      <div>{team.rank_reg}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/edition/${edition.id}/team/${team.team.id}`} className="link">
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
      <div>{team.total}</div>
      <div>{team.team.finalist && <Check className="inline-block stroke-success" />}</div>
      {team.rounds.map((score, i) => (
        <div key={i}>
          <Score
            score={score}
            maxScore={edition.contests[i].fullscore}
            className="px-2 text-center"
          />
        </div>
      ))}
    </>
  );
}

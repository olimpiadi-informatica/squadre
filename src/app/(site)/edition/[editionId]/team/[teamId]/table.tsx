"use client";

import Link from "next/link";
import { createContext, use, useCallback } from "react";

import { Medal } from "~/components/medal";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { RoundScoreItem, ScoreItem } from "~/lib/score";

const TeamContext = createContext<{ scores: ScoreItem[] }>({
  scores: [],
});

export function TeamTable({ rounds, scores }: { rounds: RoundScoreItem[]; scores: ScoreItem[] }) {
  const itemMatch = useCallback((search: string, round: RoundScoreItem) => {
    return round.roundName.toLowerCase().includes(search);
  }, []);

  return (
    <TeamContext.Provider value={{ scores }}>
      <Table
        data={rounds}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[repeat(3,auto)_repeat(var(--cols),4rem)_4.5rem]"
      />
    </TeamContext.Provider>
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

function TableRow({ item: round }: { item: RoundScoreItem }) {
  const { scores } = use(TeamContext);

  const roundScores = scores.filter((score) => score.roundSlug === round.roundSlug);
  return (
    <>
      <Link href={`/edition/${round.editionId}/round/${round.roundSlug}`} className="link">
        {round.roundName}
      </Link>
      <div>
        <Medal rank={round.rank} medal={round.medal} />
      </div>
      <div>{round.regionalRank}</div>
      <div>{round.totalScores}</div>
      {roundScores.map((score) => (
        <Link
          key={score.taskSlug}
          href={`/edition/${round.editionId}/round/${score.roundSlug}/${score.taskSlug}`}>
          <abbr title={`${score.taskTitle} (${score.taskSlug})`} className="text-black">
            <Score score={score.score} maxScore={100} />
          </abbr>
        </Link>
      ))}
    </>
  );
}

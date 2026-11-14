"use client";

import Link from "next/link";
import { createContext, use, useCallback } from "react";

import { Medal } from "~/components/medal";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import { championshipPath } from "~/lib/championship-path";
import { formatTableScore } from "~/lib/format";
import type { RoundScoreItem, ScoreItem } from "~/lib/score";

const TeamContext = createContext<{ category: string; scores: ScoreItem[] }>({
  category: "",
  scores: [],
});

export function TeamTable({
  rounds,
  scores,
  category,
}: {
  rounds: RoundScoreItem[];
  scores: ScoreItem[];
  category: string;
}) {
  const itemMatch = useCallback((search: string, round: RoundScoreItem) => {
    return round.roundName.toLowerCase().includes(search);
  }, []);

  return (
    <TeamContext.Provider value={{ category, scores }}>
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
  const { category, scores } = use(TeamContext);

  const roundScores = scores.filter((score) => score.roundSlug === round.roundSlug);
  return (
    <>
      <Link
        href={championshipPath(round.editionId, category, `/round/${round.roundSlug}`)}
        className="link">
        {round.roundName}
      </Link>
      <div>
        <Medal rank={round.rank} medal={round.medal} />
      </div>
      <div>{round.regionalRank}</div>
      <div>{formatTableScore(round.totalScores)}</div>
      {roundScores.map((score) => (
        <Link
          key={score.taskSlug}
          href={championshipPath(
            round.editionId,
            category,
            `/round/${score.roundSlug}/${score.taskSlug}`,
          )}>
          <abbr title={`${score.taskTitle} (${score.taskSlug})`} className="text-black">
            <Score score={score.score} maxScore={100} />
          </abbr>
        </Link>
      ))}
    </>
  );
}

"use client";

import Link from "next/link";
import { createContext, use } from "react";

import { Check } from "lucide-react";

import { RegionImage } from "~/components/region";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { RoundItem } from "~/lib/round";
import type { RoundScoreItem } from "~/lib/score";
import type { TeamResultItem } from "~/lib/team";

const EditionContext = createContext<{ rounds: RoundItem[]; scores: RoundScoreItem[] }>({
  rounds: [],
  scores: [],
});

export function EditionTable({
  teams,
  rounds,
  scores,
}: {
  teams: TeamResultItem[];
  rounds: RoundItem[];
  scores: RoundScoreItem[];
}) {
  return (
    <EditionContext.Provider value={{ rounds, scores }}>
      <Table
        data={teams}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[auto_auto_1fr_1fr_3rem_3rem_4rem_4rem_4rem_4rem_4.5rem]"
      />
    </EditionContext.Provider>
  );
}

function TableHeaders() {
  const { rounds } = use(EditionContext)!;

  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Teams</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Total</div>
      {rounds.map((round) => (
        <div key={round.id}>
          <Link href={`/edition/${round.editionId}/round/${round.id}`} className="link">
            {round.name}
          </Link>
        </div>
      ))}
    </>
  );
}

function TableRow({ item: team }: { item: TeamResultItem }) {
  const { rounds, scores } = use(EditionContext)!;

  return (
    <>
      <div>{team.rank}</div>
      <div>{team.regionalRank}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/edition/${team.editionId}/team/${team.id}`} className="link">
          {team.name}
        </Link>
      </div>
      <div className="min-w-56 text-wrap text-sm">
        <Link href={`/region/${team.regionId}/${team.instituteId}`} className="link">
          {team.instituteName}, {team.instituteCity}
        </Link>
      </div>
      <div>
        <Link href={`/region/${team.regionId}`}>
          <RegionImage id={team.regionId} name={team.regionName} className="inline-block" />
        </Link>
      </div>
      <div>{team.points}</div>
      <div>{team.finalist && <Check className="inline-block stroke-success" />}</div>
      {rounds
        .filter((round) => round.id !== "final")
        .map((round) => {
          const score = scores.find(
            (score) => score.teamId === team.id && score.roundId === round.id,
          );
          return (
            <div key={round.id}>
              <Score
                score={score?.totalPoints ?? 0}
                maxScore={round.maxScore}
                className="px-2 text-center"
              />
            </div>
          );
        })}
    </>
  );
}

"use client";

import Link from "next/link";
import { type CSSProperties, createContext, use, useCallback, useMemo } from "react";

import { Check } from "lucide-react";

import { RegionImage } from "~/components/region";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { RoundItem } from "~/lib/round";
import type { RoundScoreItem } from "~/lib/score";
import type { TeamResultItem } from "~/lib/team";

const EditionContext = createContext<{
  finalRound: RoundItem | undefined;
  nonFinalRounds: RoundItem[];
  scores: Record<string, RoundScoreItem[]>;
}>({
  finalRound: undefined,
  nonFinalRounds: [],
  scores: {},
});

export function EditionTable({
  teams,
  rounds,
  scores,
}: {
  teams: TeamResultItem[];
  rounds: RoundItem[];
  scores: Record<string, RoundScoreItem[]>;
}) {
  const finalRound = useMemo(() => rounds.find((r) => r.id === "final"), [rounds]);
  const nonFinalRounds = useMemo(() => rounds.filter((r) => r.id !== "final"), [rounds]);

  const itemMatch = useCallback((search: string, team: TeamResultItem) => {
    return (
      team.name.toLowerCase().includes(search) ||
      team.instituteName.toLowerCase().includes(search) ||
      team.instituteCity.toLowerCase().includes(search)
    );
  }, []);

  return (
    <EditionContext.Provider value={{ finalRound, nonFinalRounds, scores }}>
      <div className="w-full" style={{ "--cols": rounds.length - 1 } as CSSProperties}>
        <Table
          data={teams}
          itemMatch={itemMatch}
          header={TableHeaders}
          row={TableRow}
          className="grid-cols-[auto_auto_1fr_1fr_3rem_3rem_repeat(var(--cols),4rem)_4.5rem]"
        />
      </div>
    </EditionContext.Provider>
  );
}

function TableHeaders() {
  const { finalRound, nonFinalRounds } = use(EditionContext)!;

  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Teams</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Total</div>
      {[finalRound, ...nonFinalRounds]
        .filter((r) => r != null)
        .map((round) => {
          return (
            <div key={round.id}>
              {round.public ? (
                <Link href={`/edition/${round.editionId}/round/${round.id}`} className="link">
                  {round.name}
                </Link>
              ) : (
                <span>{round.name}</span>
              )}
            </div>
          );
        })}
    </>
  );
}

function TableRow({ item: team }: { item: TeamResultItem }) {
  const { finalRound, nonFinalRounds } = use(EditionContext)!;

  return (
    <>
      <div>{team.rank}</div>
      <div>{team.regionalRank}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/edition/${team.editionId}/team/${team.slug}`} className="link">
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
      <div>{team.totalScores}</div>
      {finalRound && (
        <div>{team.finalist && <Check className="inline-block stroke-success" />}</div>
      )}
      {nonFinalRounds.map((round) => (
        <RoundScore key={round.id} round={round} teamId={team.slug} />
      ))}
    </>
  );
}

function RoundScore({ round, teamId }: { round: RoundItem; teamId: string }) {
  const { scores } = use(EditionContext)!;
  const score = scores[teamId]?.find((score) => score.roundSlug === round.id);
  return (
    <div>
      {round.public && (
        <Score
          score={score?.totalScores ?? 0}
          maxScore={round.maxScore}
          className="px-2 text-center"
        />
      )}
    </div>
  );
}

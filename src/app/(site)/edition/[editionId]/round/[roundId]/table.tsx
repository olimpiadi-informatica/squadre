"use client";

import Link from "next/link";
import { createContext, use, useCallback } from "react";

import { RegionImage } from "~/components/region";
import { Score } from "~/components/score";
import { Table } from "~/components/table";
import type { ScoreItem } from "~/lib/score";
import type { TaskItem } from "~/lib/task";
import type { TeamResultItem } from "~/lib/team";

const RoundContext = createContext<{ tasks: TaskItem[]; scores: ScoreItem[] }>({
  tasks: [],
  scores: [],
});

export function RoundTable({
  tasks,
  teams,
  scores,
}: {
  tasks: TaskItem[];
  teams: TeamResultItem[];
  scores: ScoreItem[];
}) {
  const itemMatch = useCallback((search: string, team: TeamResultItem) => {
    return (
      team.name.toLowerCase().includes(search) ||
      team.instituteName.toLowerCase().includes(search) ||
      team.instituteCity.toLowerCase().includes(search)
    );
  }, []);

  return (
    <RoundContext.Provider value={{ tasks, scores }}>
      <Table
        data={teams}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[repeat(5,auto)_repeat(var(--cols),4rem)_4.5rem]"
      />
    </RoundContext.Provider>
  );
}

function TableHeaders() {
  const { tasks } = use(RoundContext)!;
  return (
    <>
      <div>Rank</div>
      <div>Reg. rank</div>
      <div>Teams</div>
      <div>Institute</div>
      <div>Region</div>
      <div>Total</div>
      {tasks.map((task) => (
        <div key={task.slug}>
          <Link
            href={`/edition/${task.editionId}/round/${task.roundSlug}/${task.slug}`}
            className="link block w-full truncate">
            {task.slug}
          </Link>
        </div>
      ))}
    </>
  );
}

function TableRow({ item: team }: { item: TeamResultItem }) {
  const { tasks, scores } = use(RoundContext)!;

  return (
    <>
      <div>{team.rank}</div>
      <div>{team.regionalRank}</div>
      <div className="min-w-32 text-wrap break-words text-sm">
        <Link href={`/edition/${team.editionId}/team/${team.slug}`} className="link">
          {team.name}
        </Link>
      </div>
      <div className="min-w-48 text-wrap text-sm">
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
      {tasks.map((task) => {
        const score = scores.find(
          (score) => score.teamSlug === team.slug && score.taskSlug === task.slug,
        );
        return (
          <Score key={task.slug} score={score?.score ?? 0} maxScore={100} className="min-w-16" />
        );
      })}
    </>
  );
}

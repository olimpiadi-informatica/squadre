"use client";

import Link from "next/link";
import { createContext, use, useCallback } from "react";

import { RegionImage } from "~/components/region";
import { Table } from "~/components/table";
import { championshipPath } from "~/lib/championship-path";
import { formatTableScore } from "~/lib/format";
import type { TaskScoreItem } from "~/lib/score";

const TaskContext = createContext<{ editionId: string; category: string }>({
  editionId: "",
  category: "",
});

export function TaskTable({
  editionId,
  category,
  scores,
}: {
  editionId: string;
  category: string;
  scores: TaskScoreItem[];
}) {
  const itemMatch = useCallback((search: string, score: TaskScoreItem) => {
    return (
      score.teamName.toLowerCase().includes(search) ||
      score.instituteName.toLowerCase().includes(search) ||
      score.instituteCity.toLowerCase().includes(search)
    );
  }, []);

  return (
    <TaskContext.Provider value={{ editionId, category }}>
      <Table
        data={scores}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={TableRow}
        className="grid-cols-[3rem_1fr_1fr_3rem_3rem]"
      />
    </TaskContext.Provider>
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

function TableRow({ item: score }: { item: TaskScoreItem }) {
  const { editionId, category } = use(TaskContext);

  return (
    <>
      <div>{score.rank}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link
          href={championshipPath(editionId, category, `/team/${score.teamSlug}`)}
          className="link">
          {score.teamName}
        </Link>
      </div>
      <div className="min-w-56 text-wrap text-sm">
        <Link href={`/region/${score.regionId}/${score.instituteId}`} className="link">
          {score.instituteName}, {score.instituteCity}
        </Link>
      </div>
      <div>
        <Link href={`/region/${score.regionId}`}>
          <RegionImage id={score.regionId} name={score.regionName} className="inline-block" />
        </Link>
      </div>
      <div>{formatTableScore(score.score)}</div>
    </>
  );
}

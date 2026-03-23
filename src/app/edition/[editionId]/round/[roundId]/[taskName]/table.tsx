"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { RegionImage } from "~/components/region";
import { Table } from "~/components/table";
import type { TaskScoreItem } from "~/lib/score";

export function TaskTable({ scores }: { scores: TaskScoreItem[] }) {
  const itemMatch = useCallback((search: string, score: TaskScoreItem) => {
    return (
      score.teamName.toLowerCase().includes(search) ||
      score.instituteName.toLowerCase().includes(search) ||
      score.instituteCity.toLowerCase().includes(search)
    );
  }, []);

  return (
    <Table
      data={scores}
      itemMatch={itemMatch}
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

function TableRow({ item: score }: { item: TaskScoreItem }) {
  const params = useParams();

  return (
    <>
      <div>{score.rank}</div>
      <div className="min-w-48 text-wrap text-sm">
        <Link href={`/edition/${params.editionId}/team/${score.teamId}`} className="link">
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
      <div>{score.score}</div>
    </>
  );
}

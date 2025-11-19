import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";
import type { ParamsOf } from "routes";

import { Highlights } from "~/components/highlights";
import { Rank } from "~/components/rank";
import { listRoundScores, listScores } from "~/lib/score";
import { listTasks } from "~/lib/task";
import { getTeam, getTeamStats, listTeams } from "~/lib/team";

import { TeamTable } from "./table";

export async function generateStaticParams(): Promise<
  ParamsOf<"/edition/[editionId]/team/[teamId]">[]
> {
  const teams = await listTeams();
  return teams.map((t) => ({ editionId: t.editionId, teamId: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]/team/[teamId]">): Promise<Metadata> {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);

  return {
    title: `OIS - ${team.name}`,
  };
}

export default async function Page({ params }: PageProps<"/edition/[editionId]/team/[teamId]">) {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);
  const stats = await getTeamStats(editionId, teamId);

  const rounds = await listRoundScores(editionId, teamId);
  const scores = await listScores(editionId, undefined, teamId);

  const tasks = await listTasks(editionId);

  const roundTasks = tasks.reduce(
    (acc, task) => {
      acc[task.roundId] = (acc[task.roundId] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const maxTasks = Math.max(...Object.values(roundTasks));

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/edition">Rankings</Link>
          </li>
          <li>
            <Link href={`/edition/${team.editionId}`}>{team.editionName}</Link>
          </li>
          <li>{team.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="*:w-full">
          <CardBody
            title={
              <div className="break-words w-full">
                {team.name} ({team.editionName}, {team.editionYear})
              </div>
            }>
            <p>
              <Link href={`/region/${team.regionId}/${team.instituteId}`} className="link">
                {team.instituteName}, {team.instituteCity}
              </Link>
              ,{" "}
              <Link href={`/region/${team.regionId}`} className="link">
                {team.regionName}
              </Link>
            </p>
            <p className="font-bold text-base-content/60">Coach: {team.coach}</p>
            <p className="break-words">
              {team.name} scored {stats.totalPoints} points, ranking <Rank position={team.rank} />{" "}
              in Italy and <Rank position={team.regionalRank} /> in {team.regionName}; for an
              average rank of {Math.round(stats.avgRoundRank * 10) / 10}, and an highest rank
              achieved in a contest of <Rank position={stats.bestRoundRank} />.
            </p>
          </CardBody>
        </Card>
        <Highlights page={`/edition/${editionId}/team/${teamId}`} />
      </div>
      <div className="w-full" style={{ "--cols": maxTasks } as CSSProperties}>
        <TeamTable rounds={rounds} scores={scores} />
      </div>
    </div>
  );
}

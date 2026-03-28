import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";
import { groupBy } from "lodash";

import { Highlights } from "~/components/highlights";
import { Rank } from "~/components/rank";
import { listRoundScores, listScores } from "~/lib/score";
import { listTasks } from "~/lib/task";
import { getTeam } from "~/lib/team";

import { TeamTable } from "./table";

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]/team/[teamId]">): Promise<Metadata> {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);
  if (!team) notFound();

  return {
    title: `OIS - ${team.name}`,
  };
}

export default async function Page({ params }: PageProps<"/edition/[editionId]/team/[teamId]">) {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);
  if (!team) notFound();

  const rounds = await listRoundScores(editionId, teamId);
  const scores = await listScores(editionId, undefined, teamId);
  const tasks = await listTasks(editionId);

  const maxTasks = Math.max(...Object.values(groupBy(tasks, "roundSlug")).map((t) => t.length));

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
              {team.name} scored {team.totalScores} points, ranking <Rank position={team.rank} /> in
              Italy and <Rank position={team.regionalRank} /> in {team.regionName}; for an average
              rank of {Math.round(team.avgRoundRank)}, and an highest rank achieved in a contest of{" "}
              <Rank position={team.bestRoundRank} />.
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

import type { Metadata } from "next";
import Link from "next/link";
import type { ParamsOf } from "next/routes";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getRound, getRoundStats, listRounds } from "~/lib/round";
import { listScores } from "~/lib/score";
import { listTasks } from "~/lib/task";
import { listRoundTeams } from "~/lib/team";

import { RoundTable } from "./table";

export async function generateStaticParams(): Promise<
  ParamsOf<"/edition/[editionId]/round/[roundId]">[]
> {
  const tasks = await listRounds();
  return tasks.map((r) => ({ editionId: r.editionId, roundId: r.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]">): Promise<Metadata> {
  const { editionId, roundId } = await params;

  const round = await getRound(editionId, roundId);

  return {
    title: `OIS - ${round.name}, ${round.editionName}`,
  };
}

export default async function Page({ params }: PageProps<"/edition/[editionId]/round/[roundId]">) {
  const { editionId, roundId } = await params;

  const round = await getRound(editionId, roundId);
  const stats = await getRoundStats(editionId, roundId);

  const tasks = await listTasks(editionId, roundId);
  const teams = await listRoundTeams(editionId, roundId);
  const scores = await listScores(editionId, roundId);

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
            <Link href={`/edition/${round.editionId}`}>{round.editionName}</Link>
          </li>
          <li>{round.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={round.name}>
            <p>
              {stats.teamScored} teams scored {stats.totalScores} points on {tasks.length} tasks,
              for an average score of {Math.round(stats.avgScore)} and a median score of{" "}
              {Math.round(stats.medianScore)}.
            </p>
          </CardBody>
        </Card>
        <Highlights page={`/edition/${editionId}/round/${roundId}`} />
      </div>
      <div className="w-full" style={{ "--cols": tasks.length } as CSSProperties}>
        <RoundTable tasks={tasks} teams={teams} scores={scores} />
      </div>
    </div>
  );
}

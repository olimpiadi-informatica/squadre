import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardActions, CardBody } from "@olinfo/react-components";
import type { ParamsOf } from "routes";

import { Highlights } from "~/components/highlights";
import { listTaskScores } from "~/lib/score";
import { getTask, getTaskStats, listTasks } from "~/lib/task";

import { TaskTable } from "./table";

export async function generateStaticParams(): Promise<
  ParamsOf<"/edition/[editionId]/round/[roundId]/[taskName]">[]
> {
  const tasks = await listTasks();
  return tasks.map((t) => ({
    editionId: t.editionId,
    roundId: t.roundId,
    taskName: t.name,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]">): Promise<Metadata> {
  const { taskName } = await params;

  const task = await getTask(taskName);

  return {
    title: `OIS - ${task.title} (${task.name})`,
  };
}

export default async function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]">) {
  const { editionId, roundId, taskName } = await params;

  const task = await getTask(taskName);
  const stats = await getTaskStats(taskName);
  const scores = await listTaskScores(taskName);

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
            <Link href={`/edition/${task.editionId}`}>{task.editionName}</Link>
          </li>
          <li>
            <Link href={`/edition/${task.editionId}/round/${task.roundId}`}>{task.roundName}</Link>
          </li>
          <li>{task.title}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`${task.title} (${task.name})`}>
            <p>
              {stats.teamScored} teams scored {stats.totalScores} points on this task, for a maximum
              score of {stats.maxScore}, an average score of {Math.round(stats.avgScore * 10) / 10}{" "}
              and a median score of {stats.medianScore}.
            </p>
          </CardBody>
        </Card>
        <Highlights page={`/edition/${editionId}/round/${roundId}/${taskName}`} />
      </div>
      <Card>
        <CardBody title="Statement">
          <p>{task.statement}</p>
          <CardActions>
            <a
              href={`https://training.olinfo.it/task/ois_${task.name}`}
              target="_blank"
              className="btn btn-primary"
              rel="noreferrer">
              Solve this problem
            </a>
          </CardActions>
        </CardBody>
      </Card>
      <div className="w-full">
        <TaskTable scores={scores} />
      </div>
    </div>
  );
}

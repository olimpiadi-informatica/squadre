import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";
import { round } from "lodash";

import { Highlights } from "~/components/highlights";
import { listTaskScores } from "~/lib/score";
import { getTask } from "~/lib/task";

import { TaskTable } from "./table";

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]">): Promise<Metadata> {
  const { taskName } = await params;

  const task = await getTask(taskName);
  if (!task) notFound();

  return {
    title: `OIS - ${task.title} (${task.slug})`,
  };
}

export default async function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]">) {
  const { editionId, roundId, taskName } = await params;

  const task = await getTask(taskName);
  if (!task) notFound();

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
            <Link href={`/edition/${task.editionId}/round/${task.roundSlug}`}>
              {task.roundName}
            </Link>
          </li>
          <li>{task.title}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`${task.title} (${task.slug})`}>
            <p>
              {task.teamScored} teams scored {task.totalScores} points on this task, for a maximum
              score of {task.maxScore}, an average score of {round(task.avgScore, 2)} and a median
              score of {task.medianScore}.
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
              href={`https://training.olinfo.it/task/ois_${task.slug}`}
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

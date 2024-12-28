import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEdition } from "~/lib/edition";
import { getEditions } from "~/lib/editions";
import { getRound } from "~/lib/round";
import { getTask } from "~/lib/task";

import { TaskTable } from "./table";

type Props = {
  params: { editionId: string; roundId: string; taskName: string };
};

export async function generateStaticParams() {
  const editions = await getEditions();
  const params = await Promise.all(
    editions.editions.map(async ({ id }) => {
      const edition = await getEdition(id);
      const rounds = edition.contests.filter(({ tasks }) => tasks).map(({ id }) => id);
      if (edition.final) rounds.push("final");
      return Promise.all(
        rounds.map(async (roundId) => {
          const round = await getRound(id, roundId);
          return round.tasks.map(({ name: taskName }): Props["params"] => ({
            editionId: id.toString(),
            roundId,
            taskName,
          }));
        }),
      );
    }),
  );
  return params.flat(2);
}

export async function generateMetadata({
  params: { editionId, roundId, taskName },
}: Props): Promise<Metadata> {
  const task = await getTask(editionId, roundId, taskName);

  return {
    title: `OIS - ${task.title} (${task.name})`,
  };
}

export default async function Page({ params: { editionId, roundId, taskName } }: Props) {
  const task = await getTask(editionId, roundId, taskName);

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
            <Link href={`/edition/${task.ed_id}`}>{task.edition}</Link>
          </li>
          <li>
            <Link href={`/edition/${task.ed_id}/round/${task.r_id}`}>{task.round}</Link>
          </li>
          <li>{task.title}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`${task.title} (${task.name})`}>
            <p>
              {task.positive} teams scored {task.points} points on this task, for a maximum score of{" "}
              {task.highest}, an average score of {Math.round(task.avgpos)} and a median score of{" "}
              {task.medpos}.
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={task.highlights} />
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
        <TaskTable task={task} />
      </div>
    </div>
  );
}

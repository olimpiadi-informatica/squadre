import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { ChampionshipNav } from "~/app/(site)/championship-nav";
import { TaskTable } from "~/app/(site)/edition/[editionId]/round/[roundId]/[taskName]/table";
import { Highlights } from "~/components/highlights";
import { championshipLabel } from "~/lib/championship";
import { championshipPath } from "~/lib/championship-path";
import { formatScore } from "~/lib/format";
import { listTaskScores } from "~/lib/score";
import { getTask } from "~/lib/task";

type TaskParams = {
  params: Promise<{ editionId: string; roundId: string; taskName: string }>;
};

export async function taskMetadata({ params }: TaskParams): Promise<Metadata> {
  const { editionId, roundId, taskName } = await params;

  const task = await getTask(editionId, roundId, taskName);
  if (!task) notFound();

  return { title: `OIS - ${task.title} (${task.slug})` };
}

/**
 * Pagina di un task per campionato: statistiche del campionato scelto,
 * highlight, statement, selettore del campionato e tabella dei punteggi.
 */
export async function TaskView({ params, category }: TaskParams & { category: string }) {
  const { editionId, roundId, taskName } = await params;

  const task = await getTask(editionId, roundId, taskName);
  if (!task) notFound();

  const active = task.championships.find((row) => row.championship === category);
  if (!active) notFound();

  const scores = await listTaskScores(editionId, roundId, taskName, category);

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
            <Link href={championshipPath(editionId, category)}>{task.editionName}</Link>
          </li>
          <li>
            <Link href={championshipPath(editionId, category, `/round/${roundId}`)}>
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
              {active.stats.teamScored} teams scored {formatScore(active.stats.totalScores)} points
              on this task, for a maximum score of {formatScore(active.stats.maxScore)}, an average
              score of {formatScore(active.stats.avgScore)} and a median score of{" "}
              {formatScore(active.stats.medianScore)}.
            </p>
          </CardBody>
        </Card>
        <Highlights page={championshipPath(editionId, category, `/round/${roundId}/${taskName}`)} />
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
      <ChampionshipNav
        active={category}
        links={task.championships.map((row) => ({
          slug: row.championship,
          label: championshipLabel(editionId, row.championship),
          href: championshipPath(editionId, row.championship, `/round/${roundId}/${taskName}`),
        }))}
      />
      <div className="w-full">
        <TaskTable editionId={editionId} category={category} scores={scores} />
      </div>
    </div>
  );
}

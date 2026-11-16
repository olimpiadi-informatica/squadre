import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";

import { ChampionshipNav } from "~/app/(site)/championship-nav";
import { RoundTable } from "~/app/(site)/edition/[editionId]/round/[roundId]/table";
import { Highlights } from "~/components/highlights";
import { championshipLabel } from "~/lib/championship";
import { championshipPath } from "~/lib/championship-path";
import { formatScore } from "~/lib/format";
import { getRound } from "~/lib/round";
import { listScores } from "~/lib/score";
import { listTasks } from "~/lib/task";
import { listRoundTeams } from "~/lib/team";

type RoundParams = { params: Promise<{ editionId: string; roundId: string }> };

export async function roundMetadata({ params }: RoundParams): Promise<Metadata> {
  const { editionId, roundId } = await params;

  const round = await getRound(editionId, roundId);
  if (!round) notFound();

  return { title: `OIS - ${round.name}, ${round.editionName}` };
}

/**
 * Pagina di un round per campionato: statistiche del campionato scelto,
 * highlight, selettore del campionato e tabella (i round delle OIS 11-15 hanno
 * classifiche parallele).
 */
export async function RoundView({ params, category }: RoundParams & { category: string }) {
  const { editionId, roundId } = await params;

  const round = await getRound(editionId, roundId);
  if (!round) notFound();

  const active = round.championships.find((row) => row.championship === category);
  if (!active) notFound();

  const [tasks, teams, scores] = await Promise.all([
    listTasks(editionId, roundId, category),
    listRoundTeams(editionId, roundId, undefined, category),
    listScores(editionId, roundId, undefined, category),
  ]);

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
            <Link href={championshipPath(editionId, category)}>{round.editionName}</Link>
          </li>
          <li>{round.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={round.name}>
            <p>
              {active.stats.teamScored} teams scored {formatScore(active.stats.totalScores)} points
              on {tasks.length} tasks, for an average score of {formatScore(active.stats.avgScore)}{" "}
              and a median score of {formatScore(active.stats.medianScore)}.
            </p>
          </CardBody>
        </Card>
        <Highlights page={championshipPath(editionId, category, `/round/${roundId}`)} />
      </div>
      <ChampionshipNav
        active={category}
        links={round.championships.map((row) => ({
          slug: row.championship,
          label: championshipLabel(editionId, row.championship),
          href: championshipPath(editionId, row.championship, `/round/${roundId}`),
        }))}
      />
      <div className="w-full" style={{ "--cols": tasks.length } as CSSProperties}>
        <RoundTable tasks={tasks} teams={teams} scores={scores} category={category} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";
import { groupBy } from "es-toolkit/compat";

import { ChampionshipNav } from "~/app/(site)/championship-nav";
import { TeamTable } from "~/app/(site)/edition/[editionId]/team/[teamId]/table";
import { Highlights } from "~/components/highlights";
import { Rank } from "~/components/rank";
import { championshipLabel } from "~/lib/championship";
import { championshipPath, REGOLARI } from "~/lib/championship-path";
import { formatScore } from "~/lib/format";
import { listRoundScores, listScores } from "~/lib/score";
import { listTasks } from "~/lib/task";
import { getTeam } from "~/lib/team";

type TeamParams = { params: Promise<{ editionId: string; teamId: string }> };

export async function teamMetadata({ params }: TeamParams): Promise<Metadata> {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);
  if (!team) notFound();

  return { title: `OIS - ${team.name}` };
}

/**
 * Pagina squadra per campionato: anagrafica, classifica del campionato scelto,
 * highlight, selettore del campionato e tabella dei round.
 */
export async function TeamView({ params, category }: TeamParams & { category: string }) {
  const { editionId, teamId } = await params;

  const team = await getTeam(editionId, teamId);
  if (!team) notFound();

  const active = team.championships.find((row) => row.championship === category);
  if (!active) notFound();

  const [rounds, scores, tasks] = await Promise.all([
    listRoundScores(editionId, teamId, category),
    listScores(editionId, undefined, teamId, category),
    listTasks(editionId, undefined, category),
  ]);
  const maxTasks = Math.max(
    ...Object.values(groupBy(tasks, "roundSlug")).map((task) => task.length),
  );

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
            <Link href={championshipPath(team.editionId, category)}>{team.editionName}</Link>
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
              {team.name} scored {formatScore(active.totalScores)} points, ranking{" "}
              <Rank position={active.rank} /> in
              {category === REGOLARI
                ? " Italy"
                : ` the ${championshipLabel(team.editionId, category)} championship`}{" "}
              and <Rank position={active.regionalRank} /> in {team.regionName}; for an average rank
              of {Math.round(active.avgRoundRank)}, and an highest rank achieved in a contest of{" "}
              <Rank position={active.bestRoundRank} />.
            </p>
          </CardBody>
        </Card>
        <Highlights page={championshipPath(editionId, category, `/team/${teamId}`)} />
      </div>
      <ChampionshipNav
        active={category}
        links={team.championships.map((row) => ({
          slug: row.championship,
          label: championshipLabel(team.editionId, row.championship),
          href: championshipPath(editionId, row.championship, `/team/${teamId}`),
        }))}
      />
      <div className="w-full" style={{ "--cols": maxTasks } as CSSProperties}>
        <TeamTable rounds={rounds} scores={scores} category={category} />
      </div>
    </div>
  );
}

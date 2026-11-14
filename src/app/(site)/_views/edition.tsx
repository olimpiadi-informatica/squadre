import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { groupBy } from "es-toolkit/compat";

import { ChampionshipNav } from "~/app/(site)/championship-nav";
import { EditionTable } from "~/app/(site)/edition/[editionId]/table";
import { Highlights } from "~/components/highlights";
import { championshipLabel } from "~/lib/championship";
import { championshipPath, REGOLARI } from "~/lib/championship-path";
import { getEdition } from "~/lib/edition";
import { formatScore } from "~/lib/format";
import { listAllRounds } from "~/lib/round";
import { listRoundScores } from "~/lib/score";
import {
  listChampionshipRounds,
  listEditionChampionships,
  listEditionTeams,
  listRoundTeams,
} from "~/lib/team";

type EditionParams = { params: Promise<{ editionId: string }> };

export async function editionMetadata({ params }: EditionParams): Promise<Metadata> {
  const { editionId } = await params;

  const edition = await getEdition(editionId);
  if (!edition) notFound();

  return { title: `OIS - ${edition.name}` };
}

/**
 * Classifica di un'edizione per campionato: descrizione, highlight, selettore
 * del campionato e tabella.
 */
export async function EditionView({ params, category }: EditionParams & { category: string }) {
  const { editionId } = await params;

  const edition = await getEdition(editionId);
  if (!edition) notFound();

  // Per i regolari i round sono tutti quelli con task regolari (anche quelli
  // non ancora gareggiati), per gli altri campionati solo quelli in cui hanno
  // segnato: le classifiche non si mischiano mai.
  const [championships, topFinalist, teams, rounds, scores] = await Promise.all([
    listEditionChampionships(editionId),
    listRoundTeams(editionId, "final", 3),
    listEditionTeams(editionId, category),
    category === REGOLARI ? listAllRounds(editionId) : listChampionshipRounds(editionId, category),
    listRoundScores(editionId, undefined, category),
  ]);
  if (!championships.includes(category)) notFound();

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
          <li>{edition.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`OIS ${edition.year}`}>
            <p>
              {edition.totalTeams} teams from {edition.totalInstitutes} schools participated in this
              edition of the OIS, scoring a total of {formatScore(edition.totalScores)} points on{" "}
              {edition.totalTasks} tasks.
              {topFinalist.length > 0 && (
                <> The top {topFinalist.length} teams at the finals were:</>
              )}
            </p>
            {topFinalist.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {topFinalist.map((team) => (
                  <li key={team.slug}>
                    <Link
                      href={championshipPath(editionId, REGOLARI, `/team/${team.slug}`)}
                      className="link">
                      {team.name}
                    </Link>{" "}
                    from{" "}
                    <Link href={`/region/${team.regionId}/${team.instituteId}`} className="link">
                      {team.instituteName}, {team.instituteCity}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Highlights page={`/edition/${editionId}`} />
      </div>
      <ChampionshipNav
        active={category}
        links={championships.map((championship) => ({
          slug: championship,
          label: championshipLabel(editionId, championship),
          href: championshipPath(editionId, championship),
        }))}
      />
      <EditionTable
        teams={teams}
        rounds={rounds}
        scores={groupBy(scores, "teamSlug")}
        category={category}
      />
    </div>
  );
}

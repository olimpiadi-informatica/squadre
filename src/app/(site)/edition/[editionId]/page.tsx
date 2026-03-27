import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { groupBy } from "lodash";

import { Highlights } from "~/components/highlights";
import { getEdition, getEditionStats } from "~/lib/edition";
import { listAllRounds } from "~/lib/round";
import { listRoundScores } from "~/lib/score";
import { listEditionTeams, listRoundTeams } from "~/lib/team";

import { EditionTable } from "./table";

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]">): Promise<Metadata> {
  const { editionId } = await params;

  const edition = await getEdition(editionId);
  if (!edition) notFound();

  return {
    title: `OIS - ${edition.name}`,
  };
}

export default async function Page({ params }: PageProps<"/edition/[editionId]">) {
  const { editionId } = await params;

  const edition = await getEdition(editionId);
  if (!edition) notFound();
  const stats = await getEditionStats(editionId);
  const topFinalist = await listRoundTeams(editionId, "final", 3);

  const teams = await listEditionTeams(editionId);
  const rounds = await listAllRounds(editionId);
  const scores = groupBy(await listRoundScores(editionId), "teamId");

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
              {stats.totalTeams} teams from {stats.totalInstitutes} schools participated in this
              edition of the OIS, scoring a total of {stats.totalPoints} points on{" "}
              {stats.totalTasks} tasks.
              {topFinalist.length > 0 && (
                <> The top {topFinalist.length} teams at the finals were:</>
              )}
            </p>
            {topFinalist.length > 0 && (
              <ol className="list-decimal pl-6">
                {topFinalist.map((team) => (
                  <li key={team.id} value={team.rank}>
                    <Link href={`/edition/${editionId}/team/${team.id}`} className="link">
                      {team.name}
                    </Link>{" "}
                    from{" "}
                    <Link href={`/region/${team.regionId}/${team.instituteId}`} className="link">
                      {team.instituteName}, {team.instituteCity}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
        <Highlights page={`/edition/${editionId}`} />
      </div>
      <div className="w-full">
        <EditionTable teams={teams} rounds={rounds} scores={scores} />
      </div>
    </div>
  );
}

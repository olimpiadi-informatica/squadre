import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";
import type { ParamsOf } from "routes";

import { Highlights } from "~/components/highlights";
import { getEdition, getEditionStats, listEditions } from "~/lib/edition";
import { listRounds } from "~/lib/round";
import { listRoundScores } from "~/lib/score";
import { listEditionTeams, listRoundTeams } from "~/lib/team";

import { EditionTable } from "./table";

export async function generateStaticParams(): Promise<ParamsOf<"/edition/[editionId]">[]> {
  const editions = await listEditions();
  return editions.map((e) => ({ editionId: e.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/edition/[editionId]">): Promise<Metadata> {
  const { editionId } = await params;

  const edition = await getEdition(editionId);

  return {
    title: `OIS - ${edition.name}`,
  };
}

export default async function Page({ params }: PageProps<"/edition/[editionId]">) {
  const { editionId } = await params;

  const edition = await getEdition(editionId);
  const stats = await getEditionStats(editionId);
  const topFinalist = await listRoundTeams(editionId, "final", 3);

  const teams = await listEditionTeams(editionId);
  const rounds = await listRounds(editionId);
  const scores = await listRoundScores(editionId);

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
              {topFinalist.length && <> The top {topFinalist.length} teams at the finals were:</>}
            </p>
            {topFinalist.length && (
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

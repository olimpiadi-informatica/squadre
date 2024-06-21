import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEdition } from "~/lib/edition";
import { getEditions } from "~/lib/editions";

import { EditionTable } from "./table";

type Props = {
  params: { editionId: string };
};

export async function generateStaticParams() {
  const editions = await getEditions();
  return editions.editions.map(({ id }): Props["params"] => ({ editionId: id.toString() }));
}

export async function generateMetadata({ params: { editionId } }: Props): Promise<Metadata> {
  const edition = await getEdition(editionId);

  return {
    title: `OIS - ${edition.title}`,
  };
}

export default async function Page({ params: { editionId } }: Props) {
  const edition = await getEdition(editionId);

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
          <li>{edition.title}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`OIS ${edition.year}`}>
            <p>
              {edition.teams} teams from {edition.instnum} schools participated in this edition of
              the OIS, scoring a total of {edition.points} points on {edition.tasks} tasks. The top{" "}
              {edition.final.ranking.length} teams at the finals were:
            </p>
            <ol className="list-decimal pl-6">
              {edition.final.ranking.map((team, i) => (
                <li key={i} value={team.rank}>
                  <Link href={`/edition/${editionId}/team/${team.team.id}`} className="link">
                    {team.team.name}
                  </Link>{" "}
                  from{" "}
                  <Link href={`/region/${team.team.region}/${team.team.inst_id}`} className="link">
                    {team.team.institute}
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <Highlights highlights={edition.highlights} />
      </div>
      <div className="w-full">
        <EditionTable edition={edition} />
      </div>
    </div>
  );
}

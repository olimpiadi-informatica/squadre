import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEdition } from "~/lib/edition";
import { getEditions } from "~/lib/editions";
import { getTeam } from "~/lib/team";

import { TeamTable } from "./table";

type Props = {
  params: { editionId: string; teamId: string };
};

export async function generateStaticParams() {
  const editions = await getEditions();
  const params = await Promise.all(
    editions.editions.map(async ({ id }) => {
      const edition = await getEdition(id);
      return edition.rounds.map((team): Props["params"] => ({
        editionId: id.toString(),
        teamId: team.team.id,
      }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({
  params: { editionId, teamId },
}: Props): Promise<Metadata> {
  const team = await getTeam(editionId, teamId);

  return {
    title: `OIS - ${team.name}`,
  };
}

export default async function Page({ params: { editionId, teamId } }: Props) {
  const team = await getTeam(editionId, teamId);

  const maxTasks = Math.max(...team.contests.map((round) => round.tasks.length));

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
            <Link href={`/edition/${team.ed_num}`}>{team.edition}</Link>
          </li>
          <li>{team.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="*:w-full">
          <CardBody
            title={
              <div className="break-words w-full">
                {team.name} ({team.edition}, {team.year})
              </div>
            }>
            <p>
              <Link href={`/region/${team.region}/${team.inst_id}`} className="link">
                {team.institute}
              </Link>
              ,{" "}
              <Link href={`/region/${team.region}`} className="link">
                {team.fullregion}
              </Link>
            </p>
            <p className="font-bold text-base-content/60">Coach: {team.coach}</p>
            <p className="break-words">
              {team.name} scored {team.points} points, ranking {team.rank_tot} in Italy and{" "}
              {team.rank_reg} in {team.fullregion}; for an average ranking of{" "}
              {Math.round(team.avgrank)}%, and an highest rank achieved in a contest of{" "}
              {team.bestrank}.
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={team.highlights} />
      </div>
      <div className="w-full" style={{ "--cols": maxTasks } as CSSProperties}>
        <TeamTable team={team} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";
import type { ParamsOf } from "routes";

import { Highlights } from "~/components/highlights";
import { Rank } from "~/components/rank";
import { listEditions } from "~/lib/edition";
import { getInstitute, getInstituteStats, listInstitutes } from "~/lib/institute";
import { listTeams } from "~/lib/team";

import { InstituteTable } from "./table";

export async function generateStaticParams(): Promise<
  ParamsOf<"/region/[regionId]/[instituteId]">[]
> {
  const institutes = await listInstitutes();
  return institutes.map((i) => ({ regionId: i.regionId, instituteId: i.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/region/[regionId]/[instituteId]">): Promise<Metadata> {
  const { instituteId } = await params;

  const institute = await getInstitute(instituteId);

  return {
    title: `OIS - ${institute.name}, ${institute.city}`,
  };
}

export default async function Page({ params }: PageProps<"/region/[regionId]/[instituteId]">) {
  const { regionId, instituteId } = await params;

  const institute = await getInstitute(instituteId);
  const stats = await getInstituteStats(instituteId);
  const teams = await listTeams(instituteId);
  const editions = await listEditions();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/region">Teams</Link>
          </li>
          <li>
            <Link href={`/region/${institute.regionId}`}>{institute.regionName}</Link>
          </li>
          <li>{institute.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`${institute.name}, ${institute.city}, ${institute.regionName}`}>
            <p>
              {institute.totalTeams} teams from this institute participated in{" "}
              {institute.totalEditions} OIS editions, scoring a total of {institute.totalPoints}{" "}
              points.
            </p>
            <p>
              The best rank ever achieved by a team of {institute.name} is{" "}
              <Rank position={stats.bestEditionRank} /> in an edition (
              <Rank position={stats.bestRoundRank} /> in a contest).
            </p>
          </CardBody>
        </Card>
        <Highlights page={`/region/${regionId}/${instituteId}`} />
      </div>
      <div className="w-full">
        <InstituteTable editions={editions} teams={teams} />
      </div>
    </div>
  );
}

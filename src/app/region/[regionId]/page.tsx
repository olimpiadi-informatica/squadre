import type { Metadata } from "next";
import Link from "next/link";
import type { ParamsOf } from "next/routes";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { Rank } from "~/components/rank";
import { RegionImage } from "~/components/region";
import { listInstitutes } from "~/lib/institute";
import { getRegion, getRegionStats, listRegions } from "~/lib/region";

import { RegionTable } from "./table";

export async function generateStaticParams(): Promise<ParamsOf<"/region/[regionId]">[]> {
  const regions = await listRegions();
  return regions.map((r) => ({ regionId: r.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/region/[regionId]">): Promise<Metadata> {
  const { regionId } = await params;

  const region = await getRegion(regionId);

  return {
    title: `OIS - ${region.name}`,
  };
}

export default async function Page({ params }: PageProps<"/region/[regionId]">) {
  const { regionId } = await params;

  const region = await getRegion(regionId);
  const stats = await getRegionStats(regionId);
  const institutes = await listInstitutes(regionId);

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
          <li>{region.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody
            title={
              <>
                <RegionImage id={region.id} name={region.name} className="inline-block" />
                {region.name}
              </>
            }>
            <p>
              {stats.totalTeams} teams from {stats.totalInstitutes} schools participated in{" "}
              {stats.totalEditions} OIS editions from {region.name}, scoring a total of{" "}
              {stats.totalPoints} points.
            </p>
            <p>
              The best rank ever achieved by a team in {region.name} is{" "}
              <Rank position={stats.bestEditionRank} /> in an edition (
              <Rank position={stats.bestEditionRank} /> in a contest).
            </p>
          </CardBody>
        </Card>
        <Highlights page={`/region/${regionId}`} />
      </div>
      <div className="w-full">
        <RegionTable institutes={institutes} />
      </div>
    </div>
  );
}

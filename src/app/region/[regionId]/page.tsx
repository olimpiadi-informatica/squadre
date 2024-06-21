import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { RegionImage } from "~/components/region";
import { getRegion } from "~/lib/region";
import { getRegions } from "~/lib/regions";

import { RegionTable } from "./table";

type Props = {
  params: { regionId: string };
};

export async function generateStaticParams() {
  const regions = await getRegions();
  return regions.regions.map(({ id }) => ({ regionId: id }));
}

export async function generateMetadata({ params: { regionId } }: Props): Promise<Metadata> {
  const region = await getRegion(regionId);

  return {
    title: `OIS - ${region.name}`,
  };
}

export default async function Page({ params: { regionId } }: Props) {
  const region = await getRegion(regionId);

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
              {region.teams} teams from {region.instnum} schools participated in{" "}
              {region.participations.length} OIS editions from {region.name}, scoring a total of{" "}
              {region.points} points.
            </p>
            <p>
              Schools in {region.name} have an average ranking of {Math.round(region.bestavgrank)}%,
              and the best rank ever achieved by a team is {region.bestedrank} in an edition (
              {region.bestrank} in a contest).
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={region.highlights} />
      </div>
      <div className="w-full">
        <RegionTable region={region} />
      </div>
    </div>
  );
}

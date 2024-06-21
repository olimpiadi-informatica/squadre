import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getInstitute } from "~/lib/institute";
import { getRegion } from "~/lib/region";
import { getRegions } from "~/lib/regions";

import { InstituteTable } from "./table";

type Props = {
  params: { regionId: string; instituteId: string };
};

export async function generateStaticParams() {
  const regions = await getRegions();
  const params = await Promise.all(
    regions.regions.map(async ({ id: regionId }) => {
      const region = await getRegion(regionId);
      return region.institutes.map(({ id: instituteId }): Props["params"] => ({
        regionId,
        instituteId,
      }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({
  params: { regionId, instituteId },
}: Props): Promise<Metadata> {
  const institute = await getInstitute(regionId, instituteId);

  return {
    title: `OIS - ${institute.name}, ${institute.city}`,
  };
}

export default async function Page({ params: { regionId, instituteId } }: Props) {
  const institute = await getInstitute(regionId, instituteId);

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
            <Link href={`/region/${institute.region}`}>{institute.fullregion}</Link>
          </li>
          <li>{institute.name}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={`${institute.name}, ${institute.city}, ${institute.fullregion}`}>
            <p>
              {institute.teams} teams from this institute participated in{" "}
              {institute.participations.length} OIS editions, scoring a total of {institute.points}{" "}
              points.
            </p>
            <p>
              Teams of {institute.name} have an average ranking of{" "}
              {Math.round(institute.bestavgrank)}
              %, and the best rank ever achieved by a team is {institute.bestedrank} in an edition (
              {institute.bestrank} in a contest).
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={institute.highlights} />
      </div>
      <div className="w-full">
        <InstituteTable institute={institute} />
      </div>
    </div>
  );
}

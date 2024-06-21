import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getRegions } from "~/lib/regions";

import { RegionsTable } from "./table";

export default async function Page() {
  const regions = await getRegions();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Teams</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="OIS Regions">
            <p>
              {regions.teams} teams from {regions.instnum} schools participated in{" "}
              {regions.editions} OIS editions. Overall, {regions.points} points were scored on{" "}
              {regions.tasks} tasks.
            </p>
            <p>
              Regions participated in average to {Math.round(regions.avgpart * 10) / 10} editions,
              with {regions.allpart} regions participating to all of them.
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={regions.highlights} />
      </div>
      <div className="w-full">
        <RegionsTable regions={regions} />
      </div>
    </div>
  );
}

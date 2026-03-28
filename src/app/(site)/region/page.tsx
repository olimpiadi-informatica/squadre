import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getStats } from "~/lib/edition";
import { listRegions } from "~/lib/region";

import { RegionsTable } from "./table";

export default async function Page() {
  const regions = await listRegions();
  const stats = await getStats();

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
              {stats.totalTeams} teams from {stats.totalInstitutes} schools participated in{" "}
              {stats.totalEditions} OIS editions. Overall, {stats.totalScores} points were scored.
            </p>
          </CardBody>
        </Card>
        <Highlights page="/region" />
      </div>
      <div className="w-full">
        <RegionsTable regions={regions} />
      </div>
    </div>
  );
}

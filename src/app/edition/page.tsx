import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEditions } from "~/lib/editions";

import { EditionsTable } from "./table";

export default async function Page() {
  const editions = await getEditions();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Rankings</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="OIS Editions">
            <p>
              {editions.teams} teams from {editions.instnum} schools participated in{" "}
              {editions.editions.length} OIS editions. Overall, {editions.points} points were scored
              on {editions.tasks} tasks.
            </p>
            <p>
              In average, {Math.round(editions.avgreg * 10) / 10} regions participated to the OIS
              editions, and {editions.allreg} editions were disputed with all regions.
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={editions.highlights} />
      </div>
      <div className="w-full">
        <EditionsTable editions={editions} />
      </div>
    </div>
  );
}

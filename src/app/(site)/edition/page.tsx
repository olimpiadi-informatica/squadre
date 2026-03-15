import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEditionStats, listEditions } from "~/lib/edition";

import { EditionsTable } from "./table";

export default async function Page() {
  const editions = await listEditions();
  const stats = await getEditionStats();

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
              {stats.totalTeams} teams from {stats.totalInstitutes} schools participated in{" "}
              {editions.length} OIS editions. Overall, {stats.totalPoints} points were scored on{" "}
              {stats.totalTasks} tasks.
            </p>
          </CardBody>
        </Card>
        <Highlights page="/edition" />
      </div>
      <div className="w-full">
        <EditionsTable editions={editions} />
      </div>
    </div>
  );
}

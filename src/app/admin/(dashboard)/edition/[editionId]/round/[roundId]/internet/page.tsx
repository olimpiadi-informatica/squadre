import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getTeamRoundInternetChecks } from "~/lib/internet-check";
import { getRoundAdmin } from "~/lib/round";

import { InternetTable } from "./internet-table";

type Props = {
  params: Promise<{ editionId: string; roundId: string }>;
};

export default async function AdminRoundInternetPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, teams] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getTeamRoundInternetChecks(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/admin">Tutte le edizioni</Link>
          </li>
          <li>
            <Link href={`/admin/edition/${editionId}`}>{edition.name}</Link>
          </li>
          <li>
            <Link href={`/admin/edition/${editionId}/round/${roundId}`}>{round.title}</Link>
          </li>
          <li>Internet</li>
        </ul>
      </div>

      <Card>
        <CardBody title="Controlli internet">
          <p />
        </CardBody>
      </Card>

      <InternetTable teams={teams} />
    </div>
  );
}

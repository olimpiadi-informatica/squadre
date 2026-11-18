import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { MonitorPlay } from "lucide-react";

import { PenalizationDetail } from "~/components/penalization";
import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundPenalization, getTeamPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

export default async function AdminRoundPenalizationDetailPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/penalization/[penalizationId]">) {
  await verifyAdmin();

  const { editionId, roundId, penalizationId } = await params;
  const numericPenalizationId = Number.parseInt(penalizationId, 10);
  if (Number.isNaN(numericPenalizationId)) notFound();

  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);

  if (!edition || !round) notFound();
  const penalization = await getRoundPenalization(round.id, numericPenalizationId);
  if (!penalization) notFound();
  const teams = await getTeamPenalization(penalization.teamRoundPenalizationIds);
  const evidencePath = penalization.type === "proctoring" ? "proctoring" : null;

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
          <li>
            <Link href={`/admin/edition/${editionId}/round/${roundId}/penalization`}>
              Penalizzazioni
            </Link>
          </li>
          <li>{penalizationId}</li>
        </ul>
      </div>

      <PenalizationDetail round={round} penalizationId={numericPenalizationId} />
      {evidencePath && (
        <Card>
          <CardBody title="Proctoring">
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/admin/edition/${editionId}/round/${roundId}/proctoring/${team.slug}`}
                  className="btn btn-primary btn-sm">
                  <MonitorPlay className="size-4" />
                  Apri proctoring di {team.slug}
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      {penalization.appealApproved !== null && (
        <Card>
          <CardBody title="Ricorso">
            <div className="grid gap-4">
              <p className="font-semibold">
                Ricorso {penalization.appealApproved ? "approvato" : "rigettato"}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

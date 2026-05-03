import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundPenalization, getTeamRoundPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

import { PlagiarismDetail } from "./plagiarism";

const levelLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const levelBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

type Props = {
  params: Promise<{ editionId: string; roundId: string; penalizationId: string }>;
};

export default async function AdminRoundPenalizationDetailPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId, penalizationId } = await params;
  const numericPenalizationId = Number.parseInt(penalizationId, 10);
  if (Number.isNaN(numericPenalizationId)) notFound();

  const [edition, round, penalization] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getRoundPenalization(editionId, roundId, numericPenalizationId),
  ]);

  if (!edition || !round || !penalization) notFound();

  const teams = await getTeamRoundPenalization(penalization.teamRoundPenalizationIds);

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
          <li>Copiatura #{penalization.id}</li>
        </ul>
      </div>

      <Card>
        <CardBody title="Dettaglio copiatura">
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailField
                label="Team"
                value={teams.map((team) => (
                  <div key={team.teamRoundPenalizationId}>
                    {team.teamSlug} ({team.teamName})
                  </div>
                ))}
              />
              <DetailField
                label="Livello"
                value={
                  <div className="flex flex-wrap gap-2">
                    <span className={clsx("badge badge-sm", levelBadge[penalization.level])}>
                      {levelLabel[penalization.level]}
                    </span>
                    {penalization.appealAllowed ? (
                      <span className="badge badge-sm badge-info">Appellabile</span>
                    ) : (
                      <span className="badge badge-sm badge-error">Non appellabile</span>
                    )}
                  </div>
                }
              />
              <DetailField label="Motivazione" value={penalization.description} />
            </div>
          </div>
        </CardBody>
      </Card>

      {penalization.type === "plagiarism" && <PlagiarismDetail teams={teams} />}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

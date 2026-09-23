import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { Download } from "lucide-react";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundParticipationStats } from "~/lib/participation";
import { getRoundAdmin } from "~/lib/round";

export default async function AdminRoundResocontoPage({
  params,
}: {
  params: Promise<{ editionId: string; roundId: string }>;
}) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, stats] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getRoundParticipationStats(editionId, roundId),
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
          <li>Resoconto</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold">Resoconto {round.title}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="PARTECIPAZIONE">
            <div className="flex flex-col gap-2 text-base">
              <p>
                {stats.loggedCount} su {stats.totalTeams} squadre ({stats.loggedPercent}%) si sono
                collegate
              </p>
              <p>
                Di queste, in {stats.submittedCount} ({stats.submittedPercent}%) hanno tentato
                almeno una sottoposizione
              </p>
              <p>
                Di queste, in {stats.scoredCount} ({stats.scoredPercent}%) hanno fatto punti
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody title="Scarica elenchi squadre">
            <div className="flex flex-col gap-3">
              <p className="text-sm opacity-70">
                Scarica i file di testo con l&apos;elenco degli identificativi delle squadre (utenti
                hidden esclusi).
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/resoconto/logged.txt`}
                  download="logged.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  logged.txt ({stats.loggedCount})
                </a>
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/resoconto/submitted.txt`}
                  download="submitted.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  submitted.txt ({stats.submittedCount})
                </a>
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/resoconto/scored.txt`}
                  download="scored.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  scored.txt ({stats.scoredCount})
                </a>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

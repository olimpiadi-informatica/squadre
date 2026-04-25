import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

import { PenalizationTable } from "./penalization-table";
import { UploadPlagiarismButton } from "./upload-plagiarism-button";

type Props = {
  params: Promise<{ editionId: string; roundId: string }>;
};

export default async function AdminRoundPenalizationPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, penalization] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRoundPenalization(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  const stats = {
    total: penalization.length,
    plagiarism: penalization.filter((penalization) => penalization.type === "plagiarism").length,
    red: penalization.filter((penalization) => penalization.level === "red").length,
    yellow: penalization.filter((penalization) => penalization.level === "yellow").length,
  };

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
          <li>Penalizzazioni</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardBody title="Copiature">
            <div className="grid gap-4 mt-5 md:grid-cols-4">
              <Stat label="Penalizzazioni totali" value={stats.total} />
              <Stat label="Copiature" value={stats.plagiarism} />
              <Stat label="Livello giallo" value={stats.yellow} />
              <Stat label="Livello rosso" value={stats.red} />
            </div>

            <CardActions>
              <UploadPlagiarismButton editionId={editionId} roundId={roundId} />
            </CardActions>
          </CardBody>
        </Card>
      </div>

      {penalization.length === 0 ? (
        <Card>
          <CardBody title="Penalizzazioni">
            <p>Nessuna penalizzazione presente per questo round.</p>
          </CardBody>
        </Card>
      ) : (
        <PenalizationTable penalization={penalization} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

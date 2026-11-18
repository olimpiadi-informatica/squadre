import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundProctoring } from "~/lib/proctoring";
import { getRoundAdmin } from "~/lib/round";

import { ProctoringIssuesToggle } from "./proctoring-issues-toggle";
import { ProctoringTable } from "./proctoring-table";

export default async function AdminRoundProctoringPage({
  params,
  searchParams,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/proctoring">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const { onlyIssues } = await searchParams;
  const onlyIssuesEnabled = onlyIssues === "1";

  const [edition, round, rows] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRoundProctoring(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  const visibleRows = onlyIssuesEnabled
    ? rows.filter((row) => row.hasIssues || row.penalization !== null)
    : rows;

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
          <li>Proctoring</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Proctoring</h1>
        <ProctoringIssuesToggle checked={onlyIssuesEnabled} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardBody title="Nessuna squadra">
            <p>Nessun controllo internet o registrazione disponibile per questo round.</p>
          </CardBody>
        </Card>
      ) : visibleRows.length === 0 ? (
        <p className="text-sm opacity-70">Nessun team con irregolarità.</p>
      ) : (
        <ProctoringTable rows={visibleRows} editionId={editionId} roundId={roundId} />
      )}
    </div>
  );
}

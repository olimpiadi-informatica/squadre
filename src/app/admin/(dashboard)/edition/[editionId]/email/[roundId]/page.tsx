import Link from "next/link";
import { notFound } from "next/navigation";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundEmailStatuses } from "~/lib/email";
import { getRoundAdmin } from "~/lib/round";

import { EmailTable } from "./email-table";

type Props = {
  params: Promise<{ editionId: string; roundId: string }>;
};

export default async function AdminEmailPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);
  if (!edition) notFound();
  if (!round) notFound();

  const statuses = await listRoundEmailStatuses(editionId, roundId);

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/admin">Editions</Link>
          </li>
          <li>
            <Link href={`/admin/edition/${editionId}`}>{editionId}</Link>
          </li>
          <li>Email</li>
          <li>{roundId}</li>
        </ul>
      </div>
      <h1 className="text-3xl font-bold mb-2">Email {round.title}</h1>
      <EmailTable statuses={statuses} editionId={editionId} roundId={roundId} />
    </div>
  );
}

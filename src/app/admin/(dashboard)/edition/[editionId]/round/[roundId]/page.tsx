import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { intlFormat } from "date-fns";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundAdmin } from "~/lib/round";

import { RoundActions } from "./round-actions";

type Props = {
  params: Promise<{ editionId: string; roundId: string }>;
};

export default async function AdminRoundPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
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
            <Link href={`/admin/edition/${edition.id}`}>{edition.name}</Link>
          </li>
          <li>{round.title}</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold">{round.title}</h1>

      <Card>
        <CardBody title="Dettagli round">
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <p>
              <span className="font-semibold">Data:</span>{" "}
              {intlFormat(
                round.startsAt,
                { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" },
                { locale: "it-IT" },
              )}
            </p>
            <p>
              <span className="font-semibold">Task caricati:</span> {round.taskCount}
            </p>
            <p>
              <span className="font-semibold">Email inviate:</span> {round.sentEmailCount}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody title="Azioni">
          <RoundActions round={round} />
        </CardBody>
      </Card>
    </div>
  );
}

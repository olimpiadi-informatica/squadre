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
          <div className="grid grid-cols-[repeat(2,auto)] gap-x-4 w-fit">
            <p className="font-semibold">Data:</p>
            <p>
              {intlFormat(
                round.startsAt,
                { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" },
                { locale: "it-IT" },
              )}
            </p>
            <p className="font-semibold">Fine:</p>
            <p>
              {intlFormat(
                round.endsAt,
                { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" },
                { locale: "it-IT" },
              )}
            </p>
            <p className="font-semibold">Scuole:</p>
            <p>{round.schoolCount}</p>
            <p className="font-semibold">Team:</p>
            <p>{round.teamCount}</p>
            <p className="font-semibold">Task:</p>
            <p>{round.taskCount}</p>
            <p className="font-semibold">Credenziali inviate:</p>
            <p>
              {round.sentEmailCount} / {round.schoolCount}
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

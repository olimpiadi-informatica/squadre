import Link from "next/link";
import { notFound } from "next/navigation";

import { InternetDetails } from "~/components/penalization/internet";
import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundAdmin } from "~/lib/round";
import { getTeamAdmin } from "~/lib/team";

export default async function AdminRoundInternetTeamPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/internet/[teamId]">) {
  await verifyAdmin();

  const { editionId, roundId, teamId } = await params;
  const [edition, round, team] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getTeamAdmin(editionId, roundId, teamId),
  ]);

  if (!edition || !round || !team) notFound();

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
            <Link href={`/admin/edition/${editionId}/round/${roundId}/internet`}>Internet</Link>
          </li>
          <li>{team.slug}</li>
        </ul>
      </div>
      <InternetDetails round={round} team={team} />
    </div>
  );
}

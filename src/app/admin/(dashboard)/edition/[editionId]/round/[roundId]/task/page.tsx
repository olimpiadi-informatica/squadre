import Link from "next/link";
import { notFound } from "next/navigation";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundAdmin } from "~/lib/round";
import { listAllRoundTasks } from "~/lib/task";

import { TaskManager } from "./task-manager";

export default async function AdminRoundTaskPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/task">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  const tasks = await listAllRoundTasks(editionId, roundId);

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
          <li>
            <Link href={`/admin/edition/${edition.id}/round/${round.slug}`}>{round.title}</Link>
          </li>
          <li>Task</li>
        </ul>
      </div>

      <TaskManager roundId={round.id} initialTasks={tasks} />
    </div>
  );
}

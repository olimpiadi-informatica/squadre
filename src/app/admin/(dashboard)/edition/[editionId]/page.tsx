import Link from "next/link";
import { notFound } from "next/navigation";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundsAdmin } from "~/lib/round";

import { AdminRoundsTable } from "./rounds-table";

type Props = {
  params: Promise<{ editionId: string }>;
};

export default async function AdminEditionPage({ params }: Props) {
  await verifyAdmin();

  const { editionId } = await params;
  const edition = await getEditionAdmin(editionId);
  if (!edition) notFound();

  const rounds = await listRoundsAdmin(editionId);

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/admin">Editions</Link>
          </li>
          <li>{editionId}</li>
        </ul>
      </div>
      <h1 className="text-3xl font-bold mb-2">{edition.name}</h1>
      <div className="w-full">
        <AdminRoundsTable rounds={rounds} />
      </div>
    </div>
  );
}

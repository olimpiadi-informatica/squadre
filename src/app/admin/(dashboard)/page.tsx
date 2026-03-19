import { listEditionsAdmin } from "~/lib/edition";

import { AdminEditionsTable } from "./editions-table";

export default async function AdminPage() {
  const editions = await listEditionsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>Editions</li>
        </ul>
      </div>
      <div className="w-full">
        <AdminEditionsTable editions={editions} />
      </div>
    </div>
  );
}

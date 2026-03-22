import type { ReactNode } from "react";

import { verifyAdmin } from "~/lib/admin";

import { AdminNavbar } from "./navbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await verifyAdmin();

  return (
    <>
      <AdminNavbar name={session.user.name} />
      <div className="mx-auto flex w-full max-w-screen-xl grow flex-col p-4 pb-8 isolate">{children}</div>
    </>
  );
}

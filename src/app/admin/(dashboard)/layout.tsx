import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";

import { AdminNavbar } from "./navbar";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminNavbar name={session.user.name} />
      <div className="mx-auto flex w-full max-w-screen-xl grow flex-col p-4 pb-8 isolate">{children}</div>
    </>
  );
}

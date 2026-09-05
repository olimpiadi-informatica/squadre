import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Layout } from "@olinfo/react-components";

import { getInstitutePenalizationAccess } from "~/lib/penalization";

import { TeacherNavbar } from "./navbar";

export default async function TeacherLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getInstitutePenalizationAccess(token);
  if (!access) notFound();

  return (
    <Layout>
      <TeacherNavbar instituteName={access.instituteName} instituteCity={access.instituteCity} />
      <div className="mx-auto flex w-full max-w-screen-xl grow flex-col p-4 pb-8 isolate">
        {children}
      </div>
    </Layout>
  );
}

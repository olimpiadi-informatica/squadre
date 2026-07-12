import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailCard } from "~/components/email/email-card";
import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundEmailStatuses } from "~/lib/email";
import { getEmailTemplateContent, PASSWORD_EMAIL_TEMPLATE_ID } from "~/lib/email-template";
import { getRoundAdmin } from "~/lib/round";

import { savePasswordEmailTemplate, sendEmail } from "./actions";
import { EmailTable } from "./email-table";

export default async function AdminEmailPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/email">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const edition = await getEditionAdmin(editionId);
  const round = await getRoundAdmin(editionId, roundId);
  if (!edition || !round) notFound();

  const [statuses, passwordTemplate] = await Promise.all([
    listRoundEmailStatuses(editionId, roundId),
    getEmailTemplateContent(PASSWORD_EMAIL_TEMPLATE_ID),
  ]);

  async function onSendAll(instituteId: string) {
    "use server";
    await sendEmail(editionId, roundId, instituteId, false);
  }

  async function onSaveTemplate(content: string) {
    "use server";
    await savePasswordEmailTemplate(editionId, roundId, content);
  }

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
          <li>Email</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <EmailCard
          statuses={statuses}
          onSendAll={onSendAll}
          templateLabel="Template password"
          templateContent={passwordTemplate ?? ""}
          onSaveTemplate={onSaveTemplate}
        />
      </div>
      <div className="w-full">
        <EmailTable statuses={statuses} editionId={editionId} roundId={roundId} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundEmailStatuses } from "~/lib/email";
import { getEmailTemplateContent, PASSWORD_EMAIL_TEMPLATE_ID } from "~/lib/email-template";
import { getRoundAdmin } from "~/lib/round";

import { BulkSendButton } from "./bulk-send";
import { EmailTable } from "./email-table";
import { PasswordTemplateModal } from "./password-template-modal";

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
        <Card>
          <CardBody title="Invia email">
            <p>{statuses.length} scuole partecipano a questo round:</p>
            <ul className="list-disc ml-4">
              <li>email non inviate: {statuses.filter((s) => s.status === "not-sent").length}</li>
              <li>email inviate: {statuses.filter((s) => s.status === "sent").length}</li>
              <li>
                email in errore: {statuses.filter((s) => s.status === "sending-failed").length}
              </li>
            </ul>
            <CardActions>
              <BulkSendButton editionId={editionId} roundId={roundId} statuses={statuses} />
            </CardActions>
          </CardBody>
        </Card>
        <Card>
          <CardBody title="Template password">
            <p>Apri il modal per modificare il template delle email con le password.</p>
            <CardActions>
              <PasswordTemplateModal
                editionId={editionId}
                roundId={roundId}
                content={passwordTemplate ?? ""}
              />
            </CardActions>
          </CardBody>
        </Card>
      </div>
      <div className="w-full">
        <EmailTable statuses={statuses} editionId={editionId} roundId={roundId} />
      </div>
    </div>
  );
}

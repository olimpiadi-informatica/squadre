import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { BulkSendButton } from "~/components/email/bulk-send";
import { TemplateModal } from "~/components/email/template-modal";
import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundPenalizationEmailGroups, type RoundEmailStatus } from "~/lib/email";
import {
  getEmailTemplateContent,
  PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID,
  PENALIZATION_EMAIL_TEMPLATE_ID,
} from "~/lib/email-template";
import { getRoundAdmin } from "~/lib/round";
import { isPenalizationEmailClosed } from "~/lib/round-config";

import {
  savePenalizationAppealResultEmailTemplate,
  savePenalizationEmailTemplate,
  sendPenalizationEmail,
} from "./actions";
import { PenalizationEmailTable } from "./penalization-email-table";

export default async function AdminPenalizationEmailPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/penalization-email">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, groups, template, appealResultTemplate] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRoundPenalizationEmailGroups(editionId, roundId),
    getEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID),
    getEmailTemplateContent(PENALIZATION_APPEAL_RESULT_EMAIL_TEMPLATE_ID),
  ]);
  if (!edition || !round) notFound();
  const sendingClosed = isPenalizationEmailClosed(round.endsAt);

  async function onSendAll(instituteId: string) {
    "use server";
    await sendPenalizationEmail(editionId, roundId, instituteId);
  }

  async function onSaveTemplate(content: string) {
    "use server";
    await savePenalizationEmailTemplate(editionId, roundId, content);
  }

  async function onSaveAppealResultTemplate(content: string) {
    "use server";
    await savePenalizationAppealResultEmailTemplate(editionId, roundId, content);
  }

  const statuses = groups.map((group) => ({
    instituteId: group.instituteId,
    status: groupStatus(group),
  }));
  const pendingInstitutes = groups.filter((group) => group.pendingCount > 0).length;
  const sentEmails = groups
    .flatMap((group) => group.emails)
    .filter((email) => email.status === "sent").length;
  const failedEmails = groups
    .flatMap((group) => group.emails)
    .filter((email) => email.status === "sending-failed").length;

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
          <li>Email penalizzazioni</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="Email penalizzazioni">
            <p>{groups.length} istituti con penalizzazioni:</p>
            <ul className="list-disc ml-4">
              <li>istituti con penalizzazioni da inviare: {pendingInstitutes}</li>
              <li>email inviate: {sentEmails}</li>
              {failedEmails > 0 && <li>email in errore: {failedEmails}</li>}
            </ul>
            <CardActions>
              <BulkSendButton
                statuses={statuses}
                onSend={onSendAll}
                disabled={sendingClosed || pendingInstitutes === 0}
              />
              <TemplateModal
                label="Template email penalizzazioni"
                buttonLabel="Modifica template penalizzazioni"
                content={template ?? ""}
                onSave={onSaveTemplate}
              />
              <TemplateModal
                label="Template esito ricorso"
                buttonLabel="Modifica template esito ricorso"
                content={appealResultTemplate ?? ""}
                onSave={onSaveAppealResultTemplate}
              />
            </CardActions>
          </CardBody>
        </Card>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardBody title="Email penalizzazioni">
            <p>Nessuna penalizzazione presente per questo round.</p>
          </CardBody>
        </Card>
      ) : (
        <PenalizationEmailTable
          groups={groups}
          editionId={editionId}
          roundId={roundId}
          sendingClosed={sendingClosed}
        />
      )}
    </div>
  );
}

function groupStatus(group: {
  pendingCount: number;
  emails: { status: RoundEmailStatus }[];
}): RoundEmailStatus {
  const latest = group.emails[0];
  if (group.pendingCount > 0) {
    return latest?.status === "sending" ? "sending" : "not-sent";
  }
  return latest?.status ?? "not-sent";
}

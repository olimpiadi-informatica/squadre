"use client";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { BulkSendButton } from "~/components/email/bulk-send";
import { TemplateModal } from "~/components/email/template-modal";
import type { RoundEmailStatus } from "~/lib/email";

type StatusItem = { status: RoundEmailStatus; instituteId: string };

type EmailCardProps = {
  statuses: StatusItem[];
  onSendAll: (instituteId: string) => Promise<void>;
  templateLabel: string;
  templateContent: string;
  onSaveTemplate: (content: string) => Promise<void>;
};

export function EmailCard({
  statuses,
  onSendAll,
  templateLabel,
  templateContent,
  onSaveTemplate,
}: EmailCardProps) {
  const notSent = statuses.filter((s) => s.status === "not-sent").length;
  const sending = statuses.filter((s) => s.status === "sending").length;
  const sent = statuses.filter((s) => s.status === "sent").length;
  const failed = statuses.filter((s) => s.status === "sending-failed").length;

  return (
    <Card>
      <CardBody title="Invia email">
        <p>{statuses.length} istituti:</p>
        <ul className="list-disc ml-4">
          <li>email non inviate: {notSent}</li>
          {sending > 0 && <li>email in invio: {sending}</li>}
          <li>email inviate: {sent}</li>
          <li>email in errore: {failed}</li>
        </ul>
        <CardActions>
          <BulkSendButton statuses={statuses} onSend={onSendAll} />
          <TemplateModal label={templateLabel} content={templateContent} onSave={onSaveTemplate} />
        </CardActions>
      </CardBody>
    </Card>
  );
}

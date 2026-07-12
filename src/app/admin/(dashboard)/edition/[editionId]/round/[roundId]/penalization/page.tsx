import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { EmailCard } from "~/components/email/email-card";
import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { listRoundPenalizationEmailStatuses } from "~/lib/email";
import { getEmailTemplateContent, PENALIZATION_EMAIL_TEMPLATE_ID } from "~/lib/email-template";
import { listRoundPenalization } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

import { savePenalizationEmailTemplate, sendPenalizationEmail } from "./actions";
import { PenalizationTable } from "./penalization-table";
import { UploadPlagiarismButton } from "./upload-plagiarism-button";

export default async function AdminRoundPenalizationPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/penalization">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, penalization, emailStatuses, penalizationTemplate] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    listRoundPenalization(editionId, roundId),
    listRoundPenalizationEmailStatuses(editionId, roundId),
    getEmailTemplateContent(PENALIZATION_EMAIL_TEMPLATE_ID),
  ]);
  if (!edition || !round) notFound();

  const stats = {
    total: penalization.length,
    plagiarism: penalization.filter((penalization) => penalization.type === "plagiarism").length,
    internet: penalization.filter((penalization) => penalization.type === "internet-check").length,
    red: penalization.filter((penalization) => penalization.level === "red").length,
    yellow: penalization.filter((penalization) => penalization.level === "yellow").length,
  };

  async function onSendAll(instituteId: string) {
    "use server";
    await sendPenalizationEmail(editionId, roundId, instituteId, false);
  }

  async function onSaveTemplate(content: string) {
    "use server";
    await savePenalizationEmailTemplate(editionId, roundId, content);
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
          <li>Penalizzazioni</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="Penalizzazioni">
            <div className="grid gap-4 mt-5 md:grid-cols-5">
              <Stat label="Penalizzazioni totali" value={stats.total} />
              <Stat label="Copiature" value={stats.plagiarism} />
              <Stat label="Internet" value={stats.internet} />
              <Stat label="Livello giallo" value={stats.yellow} />
              <Stat label="Livello rosso" value={stats.red} />
            </div>

            <CardActions>
              <UploadPlagiarismButton editionId={editionId} roundId={roundId} />
            </CardActions>
          </CardBody>
        </Card>
        <EmailCard
          statuses={emailStatuses}
          onSendAll={onSendAll}
          templateLabel="Template email penalizzazioni"
          templateContent={penalizationTemplate ?? ""}
          onSaveTemplate={onSaveTemplate}
        />
      </div>

      {penalization.length === 0 ? (
        <Card>
          <CardBody title="Penalizzazioni">
            <p>Nessuna penalizzazione presente per questo round.</p>
          </CardBody>
        </Card>
      ) : (
        <PenalizationTable
          penalization={penalization}
          emailStatuses={emailStatuses}
          editionId={editionId}
          roundId={roundId}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

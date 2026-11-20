import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { TriangleAlert } from "lucide-react";

import { PenalizationDetail } from "~/components/penalization";
import { PenalizationFrames } from "~/components/penalization/frames";
import { getInstitutePenalization, getInstitutePenalizationAccess } from "~/lib/penalization";
import { getRoundAdmin } from "~/lib/round";

export default async function TeacherPenalizationDetailPage({
  params,
}: PageProps<"/teacher/p/[token]/[penalizationId]">) {
  const { token, penalizationId } = await params;
  const id = Number.parseInt(penalizationId, 10);
  if (Number.isNaN(id)) notFound();

  const [access, penalization] = await Promise.all([
    getInstitutePenalizationAccess(token),
    getInstitutePenalization(token, id),
  ]);
  if (!access) notFound();

  const round = await getRoundAdmin(access.editionId, access.roundSlug);
  if (!penalization || !round) notFound();

  const isAppealOpen = Boolean(
    penalization.appealAllowed &&
      penalization.allowAppealUntil &&
      penalization.allowAppealUntil >= new Date(),
  );

  return (
    <div className="flex flex-col gap-6">
      <Link className="link link-primary w-fit" href={`/teacher/p/${token}`}>
        Torna alle penalizzazioni
      </Link>
      <PenalizationDetail round={round} penalizationId={id} />
      <PenalizationFrames penalizationId={id} srcPrefix={`/teacher/p/${token}/frame`} />

      <Card>
        <CardBody title="Ricorso">
          {penalization.appealApproved === null ? (
            penalization.appealAllowed ? (
              isAppealOpen ? (
                <div className="grid gap-3">
                  <p>
                    Per fare ricorso è necessario aprire un ticket su{" "}
                    <a
                      className="link link-primary font-medium"
                      href="https://olimpiadi-scientifiche.it/help/tickets"
                      target="_blank"
                      rel="noreferrer">
                      https://olimpiadi-scientifiche.it/help/tickets
                    </a>
                    .
                  </p>
                  <div role="alert" className="alert alert-warning text-sm">
                    <TriangleAlert className="h-5 w-5 shrink-0" />
                    <span>
                      <strong>Attenzione:</strong> in caso di ricorso rigettato, la squadra verrà
                      squalificata dal campionato.
                    </span>
                  </div>
                </div>
              ) : (
                <p>Finestra dei ricorsi chiusa</p>
              )
            ) : (
              <p>Questa penalità non è appellabile</p>
            )
          ) : (
            <p className="font-semibold">
              Ricorso {penalization.appealApproved ? "approvato" : "rigettato"}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

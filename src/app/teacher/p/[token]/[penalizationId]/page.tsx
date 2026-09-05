import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { TriangleAlert } from "lucide-react";

import { PenalizationDetail } from "~/components/penalization";
import { getInstitutePenalization, getInstitutePenalizationAccess } from "~/lib/penalization";

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
  if (!access || !penalization) notFound();

  const isAppealOpen = Boolean(
    penalization.appealAllowed &&
      penalization.allowAppealUntil &&
      penalization.allowAppealUntil >= new Date(),
  );

  const round = {
    id: access.roundId,
    slug: access.roundSlug,
    title: access.roundTitle,
    editionId: access.editionId,
    startsAt: new Date(0),
    endsAt: new Date(0),
    public: false,
    schoolCount: 0,
    teamCount: 0,
    taskCount: 0,
    sentEmailCount: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <Link className="link link-primary w-fit" href={`/teacher/p/${token}`}>
        Torna alle penalizzazioni
      </Link>
      <PenalizationDetail round={round} penalizationId={id} />

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

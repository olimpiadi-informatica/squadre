import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";

import { InternetDetails } from "~/components/penalization/internet";
import { PlagiarismDetails } from "~/components/penalization/plagiarism";
import { getRoundPenalization, getTeamPenalization } from "~/lib/penalization";
import type { RoundAdminItem } from "~/lib/round";

const levelLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const levelBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

export async function PenalizationDetail({
  round,
  penalizationId,
}: {
  round: RoundAdminItem;
  penalizationId: number;
}) {
  const penalization = await getRoundPenalization(round.id, penalizationId);
  if (!penalization) notFound();

  const teams = await getTeamPenalization(penalization.teamRoundPenalizationIds);

  return (
    <>
      <Card>
        <CardBody title="Descrizione">
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailField
                label="Team"
                value={teams.map((team) => (
                  <div key={team.id}>
                    {team.slug} ({team.name})
                  </div>
                ))}
              />
              <DetailField
                label="Livello"
                value={
                  <div className="flex flex-wrap gap-2">
                    <span className={clsx("badge badge-sm", levelBadge[penalization.level])}>
                      {levelLabel[penalization.level]}
                    </span>
                    {penalization.appealAllowed ? (
                      <span className="badge badge-sm badge-info">Appellabile</span>
                    ) : (
                      <span className="badge badge-sm badge-error">Non appellabile</span>
                    )}
                  </div>
                }
              />
              <DetailField label="Motivazione" value={penalization.description} />
            </div>
          </div>
        </CardBody>
      </Card>

      {penalization.type === "plagiarism" && <PlagiarismDetails teams={teams} />}
      {penalization.type === "internet-check" && <InternetDetails round={round} team={teams[0]} />}
    </>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

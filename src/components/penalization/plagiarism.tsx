import { Card, CardBody } from "@olinfo/react-components";
import { intlFormat } from "date-fns";

import type { TeamPenalizationDetail } from "~/lib/penalization";

import { DiffViewer } from "./diff-viewer";

export function PlagiarismDetails({ teams }: { teams: TeamPenalizationDetail[] }) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <SubmissionCard label="Sottoposizione 1" teamPenalization={teams[0]} />
        <SubmissionCard label="Sottoposizione 2" teamPenalization={teams[1]} />
      </div>

      <CodeDiffCard submissionLeft={teams[0]} submissionRight={teams[1]} />
    </>
  );
}

function SubmissionCard({
  label,
  teamPenalization,
}: {
  label: string;
  teamPenalization: TeamPenalizationDetail;
}) {
  return (
    <Card>
      <CardBody title={label}>
        <div className="grid gap-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <p className="font-semibold">Team:</p>
            <div>
              {teamPenalization.slug} ({teamPenalization.name})
            </div>
            <p className="font-semibold">Submission:</p>
            <p>{teamPenalization.submissionSlug}</p>
            <p className="font-semibold">Task:</p>
            <p>{teamPenalization.taskSlug}</p>
            <p className="font-semibold">Linguaggio:</p>
            <p>{teamPenalization.submissionLanguage}</p>
            <p className="font-semibold">Punteggio:</p>
            <p>{teamPenalization.submissionScore}</p>
            <p className="font-semibold">Orario:</p>
            <p>{formatDateTime(teamPenalization.submissionTimestamp)}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CodeDiffCard({
  submissionLeft,
  submissionRight,
}: {
  submissionLeft: TeamPenalizationDetail;
  submissionRight: TeamPenalizationDetail;
}) {
  return (
    <Card>
      <CardBody title="Differenze">
        <div className="overflow-hidden rounded-lg border border-base-300">
          <div className="h-[85vh]">
            <DiffViewer submissionLeft={submissionLeft} submissionRight={submissionRight} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function formatDateTime(date: Date | null) {
  if (!date) return "N/A";
  return intlFormat(
    date,
    { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" },
    { locale: "it-IT" },
  );
}

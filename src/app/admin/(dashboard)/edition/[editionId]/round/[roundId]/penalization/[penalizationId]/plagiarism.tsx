import { Card, CardBody } from "@olinfo/react-components";
import { intlFormat } from "date-fns";

import { DiffViewer } from "~/components/diff-viewer";
import type { TeamRoundPenalizationDetail } from "~/lib/penalization";

export function PlagiarismDetail({ teams }: { teams: TeamRoundPenalizationDetail[] }) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <SubmissionCard label="Sottoposizione 1" submission={teams[0]} />
        <SubmissionCard label="Sottoposizione 2" submission={teams[1]} />
      </div>

      <CodeDiffCard submissionLeft={teams[0]} submissionRight={teams[1]} />
    </>
  );
}

function SubmissionCard({
  label,
  submission,
}: {
  label: string;
  submission: TeamRoundPenalizationDetail;
}) {
  return (
    <Card>
      <CardBody title={label}>
        <div className="grid gap-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <p className="font-semibold">Team:</p>
            <div>
              {submission.teamSlug} ({submission.teamName})
            </div>
            <p className="font-semibold">Submission:</p>
            <p>{submission.submissionSlug}</p>
            <p className="font-semibold">Task:</p>
            <p>{submission.taskSlug}</p>
            <p className="font-semibold">Linguaggio:</p>
            <p>{submission.submissionLanguage}</p>
            <p className="font-semibold">Punteggio:</p>
            <p>{submission.submissionScore}</p>
            <p className="font-semibold">Orario:</p>
            <p>{formatDateTime(submission.submissionTimestamp)}</p>
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
  submissionLeft: TeamRoundPenalizationDetail;
  submissionRight: TeamRoundPenalizationDetail;
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

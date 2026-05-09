import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getTeamRoundInternetChecks, type TeamRoundInternetCheck } from "~/lib/internet-check";
import { getRoundAdmin } from "~/lib/round";

import { InternetTable } from "./internet-table";

export default async function AdminRoundInternetPage({
  params,
}: PageProps<"/admin/edition/[editionId]/round/[roundId]/internet">) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, teams] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getTeamRoundInternetChecks(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  const stats = getInternetStats(teams);

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
          <li>Internet</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardBody title="Controlli internet">
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Team totali" value={stats.totalTeams} />
                <Stat label="Team sospetti" value={stats.issueTeams} />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <ThresholdStats title="Check falliti" stats={stats.failedChecks} />
                <ThresholdStats title="Check mancanti" stats={stats.missingChecks} />
                <ThresholdStats title="Troppi PC" stats={stats.tooManyPc} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <InternetTable editionId={editionId} roundId={roundId} teams={teams} />
    </div>
  );
}

const CHECK_THRESHOLDS = [1, 5, 10] as const;
const PC_THRESHOLDS = [3, 4, 5] as const;

type ThresholdStat = {
  label: string;
  value: number;
};

function getInternetStats(teams: TeamRoundInternetCheck[]) {
  return {
    totalTeams: teams.length,
    issueTeams: teams.filter((team) => team.hasIssues).length,
    failedChecks: CHECK_THRESHOLDS.map((threshold) => ({
      label: `≥ ${threshold} check`,
      value: countTeams(teams, (team) => team.numFailedChecks >= threshold),
    })),
    missingChecks: CHECK_THRESHOLDS.map((threshold) => ({
      label: `≥ ${threshold} check`,
      value: countTeams(teams, (team) => team.numMissingChecks >= threshold),
    })),
    tooManyPc: PC_THRESHOLDS.map((threshold) => ({
      label: `≥ ${threshold} PC`,
      value: countTeams(teams, (team) => team.numPc >= threshold),
    })),
  };
}

function countTeams(
  teams: TeamRoundInternetCheck[],
  predicate: (team: TeamRoundInternetCheck) => boolean,
) {
  return teams.filter(predicate).length;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

function ThresholdStats({ title, stats }: { title: string; stats: ThresholdStat[] }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {stats.map((stat) => (
          <div key={stat.label} className="contents">
            <dt className="opacity-70">{stat.label}</dt>
            <dd className="font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

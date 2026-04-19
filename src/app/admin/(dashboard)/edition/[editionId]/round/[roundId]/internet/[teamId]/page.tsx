import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";
import { intlFormat, minutesToMilliseconds } from "date-fns";
import { countBy, groupBy, minBy, round } from "es-toolkit";
import { maxBy } from "es-toolkit/compat";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getTeamInternetChecks, type TeamInternetSegment } from "~/lib/internet-check";
import { getRoundAdmin } from "~/lib/round";
import {
  getRoundDurationMinutes,
  getRoundEndForTeam,
  getRoundStartForTeam,
} from "~/lib/round-config";
import { getTeamAdmin } from "~/lib/team";

type Props = {
  params: Promise<{ editionId: string; roundId: string; teamId: string }>;
};

export default async function AdminRoundInternetTeamPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId, teamId } = await params;
  const [edition, round, team] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getTeamAdmin(editionId, roundId, teamId),
  ]);

  if (!edition || !round || !team) notFound();

  const raceStart = getRoundStartForTeam(round.startsAt, round.slug, team.delay);
  const raceEnd = getRoundEndForTeam(round.startsAt, round.endsAt, round.slug, team.delay);
  const roundDurationMinutes = getRoundDurationMinutes(round.startsAt, round.endsAt, round.slug);

  const segments = await getTeamInternetChecks(round.id, team.id);
  const pcChecks = groupBy(segments, (segment) => segment.pcHash);
  const actualChecks = segments.filter(
    (segment) => segment.status === "succeeded" || segment.status === "failed",
  );
  const scoredSegments = segments.filter((segment) => segment.status !== "empty");
  const totalSucceededChecks = segments.filter((segment) => segment.status === "succeeded").length;
  const firstCheck = minBy(actualChecks, (s) => s.startTs.getTime());
  const lastCheck = maxBy(actualChecks, (s) => s.startTs.getTime());
  const numPc = Object.keys(pcChecks).length;
  const averageChecksPerPcPerMinute =
    numPc === 0 ? null : (actualChecks.length / numPc / roundDurationMinutes).toFixed(2);

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
          <li>
            <Link href={`/admin/edition/${editionId}/round/${roundId}/internet`}>Internet</Link>
          </li>
          <li>{team.name}</li>
        </ul>
      </div>

      <Card>
        <CardBody title={team.name}>
          <div className="grid grid-cols-[repeat(2,auto)] gap-x-4 w-fit">
            <p className="font-semibold">Username:</p>
            <p>{team.slug}</p>
            <p className="font-semibold">Istituto:</p>
            <p>
              {team.instituteName}, {team.instituteCity}
            </p>
            <p className="font-semibold">Controlli:</p>
            <p>
              {totalSucceededChecks} / {scoredSegments.length}
            </p>
            <p className="font-semibold">PC monitorati:</p>
            <p>{numPc}</p>
            <p className="font-semibold">Check/min:</p>
            <p>{averageChecksPerPcPerMinute ?? "-"}</p>
            <p className="font-semibold">Intervallo gara:</p>
            <p>
              {formatCheckTs(raceStart)} - {formatCheckTs(raceEnd)}
            </p>
            <p className="font-semibold">Primo check:</p>
            <p>{formatCheckTs(firstCheck?.startTs)}</p>
            <p className="font-semibold">Ultimo check:</p>
            <p>{formatCheckTs(lastCheck?.startTs)}</p>
          </div>
        </CardBody>
      </Card>

      {Object.keys(pcChecks).length === 0 ? (
        <p className="italic opacity-70">Nessun internet check disponibile per questo team.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(pcChecks).map(([pc, pcSegments]) => (
            <PcInternet
              key={pc}
              segments={pcSegments}
              roundDurationMinutes={roundDurationMinutes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PcInternet({
  segments,
  roundDurationMinutes,
}: {
  segments: TeamInternetSegment[];
  roundDurationMinutes: number;
}) {
  const scoredSegments = segments.filter((segment) => segment.status !== "empty");
  const pcInfo = segments[0];
  const totalChecks = scoredSegments.length;
  const checkTypes = countBy(scoredSegments, (segment) => segment.status);
  const successRate =
    totalChecks === 0 ? 0 : round(((checkTypes.succeeded ?? 0) / totalChecks) * 100, 1);

  return (
    <div className="p-3 border border-base-content/10 rounded-lg bg-base-200">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-semibold">
            PC: <code>{pcInfo.pcHash.slice(0, 8)}</code>
          </h2>
          <div className="grid grid-cols-[repeat(2,auto)] gap-x-3 text-sm opacity-80">
            <p className="font-semibold">Browser:</p>
            <p>
              {pcInfo.browserName ?? "-"} {pcInfo.browserMajor}
            </p>
            <p className="font-semibold">OS:</p>
            <p>{pcInfo.osName ?? "-"}</p>
          </div>
        </div>
        <div className="text-sm">
          success rate: <span className="font-semibold">{successRate}%</span> | succeeded:{" "}
          {checkTypes.succeeded ?? 0} | failed: {checkTypes.failed ?? 0} | missing:{" "}
          {checkTypes.missing ?? 0}
        </div>
      </div>
      <div className="h-5 flex w-full rounded border border-base-300 bg-base-200">
        {segments.map((segment, index) => {
          const width =
            (segment.endTs.getTime() - segment.startTs.getTime()) /
            minutesToMilliseconds(roundDurationMinutes);
          const isEmptySegment = segment.status === "empty";

          return (
            <div
              key={index}
              className={clsx(
                "h-full",
                getSegmentColorClass(segment.status),
                !isEmptySegment && "tooltip",
              )}
              data-tip={
                isEmptySegment
                  ? undefined
                  : `${formatCheckTs(segment.startTs)} ${formatSegmentLabel(segment.status)}`
              }
              style={{ width: `${width * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function getSegmentColorClass(status: TeamInternetSegment["status"]) {
  switch (status) {
    case "succeeded":
      return "bg-success";
    case "failed":
      return "bg-error";
    case "missing":
      return "bg-warning";
    case "empty":
      return "bg-base-content/10";
  }
}

function formatSegmentLabel(status: TeamInternetSegment["status"]) {
  switch (status) {
    case "succeeded":
      return "✅";
    case "failed":
      return "❌";
    case "missing":
      return "⚠️";
    case "empty":
      return "";
  }
}

function formatCheckTs(ts?: Date) {
  if (!ts) return "-";

  return intlFormat(ts, { timeStyle: "medium", timeZone: "Europe/Rome" }, { locale: "it-IT" });
}

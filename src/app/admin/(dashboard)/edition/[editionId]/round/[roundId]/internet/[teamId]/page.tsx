import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";
import {
  addMilliseconds,
  addSeconds,
  differenceInMilliseconds,
  hoursToMilliseconds,
  intlFormat,
  max,
  min,
} from "date-fns";
import { countBy, groupBy, round } from "es-toolkit";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getTeamInternetChecks, type TeamInternetCheck } from "~/lib/internet-check";
import { getRoundAdmin } from "~/lib/round";
import { getTeamAdmin } from "~/lib/team";

type Props = {
  params: Promise<{ editionId: string; roundId: string; teamId: string }>;
};

const ROUND_DURATION_MS = hoursToMilliseconds(3);
const ROUND_DURATION_MINUTES = ROUND_DURATION_MS / 60_000;
const CHECK_VALIDITY_MS = 75_000;

export default async function AdminRoundInternetTeamPage({ params }: Props) {
  await verifyAdmin();

  const { editionId, roundId, teamId } = await params;
  const [edition, round, team] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getTeamAdmin(editionId, roundId, teamId),
  ]);

  if (!edition || !round || !team) notFound();

  const raceStart = addSeconds(round.startsAt, team.delay);
  const raceEnd = addMilliseconds(raceStart, ROUND_DURATION_MS);
  const allChecks = await getTeamInternetChecks(round.id, team.id);
  const checks = allChecks.filter(
    (check) => check.serverTs >= raceStart && check.serverTs <= raceEnd,
  );
  const lastPreStartCheckByPc = new Map<string, TeamInternetCheck>();
  for (const check of allChecks) {
    if (check.serverTs >= raceStart) {
      break;
    }
    lastPreStartCheckByPc.set(check.pcHash, check);
  }

  const pcChecks = groupBy(checks, (c) => c.pcHash);
  for (const [pcHash, check] of lastPreStartCheckByPc) {
    const isStillValidAtRaceStart = addMilliseconds(check.serverTs, CHECK_VALIDITY_MS) > raceStart;
    if (!isStillValidAtRaceStart) continue;
    pcChecks[pcHash] = [check, ...(pcChecks[pcHash] ?? [])];
  }

  const totalPassedChecks = checks.filter((check) => isCheckPassed(check)).length;
  const firstCheck = allChecks.at(0);
  const lastCheck = allChecks.at(-1);
  const numPc = Object.keys(pcChecks).length;
  const averageChecksPerPcPerMinute =
    numPc === 0 ? null : (checks.length / numPc / ROUND_DURATION_MINUTES).toFixed(2);

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
              {totalPassedChecks} / {checks.length}
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
            <p>{formatCheckTs(firstCheck?.serverTs)}</p>
            <p className="font-semibold">Ultimo check:</p>
            <p>{formatCheckTs(lastCheck?.serverTs)}</p>
          </div>
        </CardBody>
      </Card>

      {Object.keys(pcChecks).length === 0 ? (
        <p className="italic opacity-70">Nessun internet check disponibile per questo team.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(pcChecks).map(([pc, pcChecks]) => (
            <PcInternet key={pc} checks={pcChecks} raceStart={raceStart} raceEnd={raceEnd} />
          ))}
        </div>
      )}
    </div>
  );
}

function PcInternet({
  checks,
  raceStart,
  raceEnd,
}: {
  checks: TeamInternetCheck[];
  raceStart: Date;
  raceEnd: Date;
}) {
  const segments = getCheckSegments(checks, raceStart, raceEnd);
  const scoredSegments = segments.filter((segment) => segment.type !== "empty");

  const pcHash = checks[0].pcHash;

  const totalChecks = scoredSegments.length;
  const checkTypes = countBy(scoredSegments, (s) => s.type);
  const passRate = totalChecks === 0 ? 0 : round(((checkTypes.passed ?? 0) / totalChecks) * 100, 1);

  return (
    <div className="p-3 border border-base-content/10 rounded-lg bg-base-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="font-semibold">
          PC: <code>{pcHash.slice(0, 8)}</code>
        </h2>
        <div className="text-sm">
          pass rate: <span className="font-semibold">{passRate}%</span> | passed:{" "}
          {checkTypes.passed ?? 0} | failed: {checkTypes.failed ?? 0} | missing:{" "}
          {checkTypes.missing ?? 0}
        </div>
      </div>
      <div className="h-5 flex w-full rounded border border-base-300 bg-base-200">
        {segments.map((segment, index) => {
          const width = differenceInMilliseconds(segment.end, segment.start) / ROUND_DURATION_MS;
          const isEmptySegment = segment.type === "empty";
          return (
            <div
              key={index}
              className={clsx("h-full", segment.colorClass, !isEmptySegment && "tooltip")}
              data-tip={
                segment.tooltip ? `${formatCheckTs(segment.start)} ${segment.tooltip}` : undefined
              }
              style={{ width: `${width * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function isCheckPassed({ ic }: TeamInternetCheck) {
  return ic.every((value) => value);
}

type CheckSegment = {
  start: Date;
  end: Date;
  type: "passed" | "failed" | "missing" | "empty";
  colorClass: string;
  tooltip?: string;
};

function getCheckSegments(
  checks: TeamInternetCheck[],
  raceStart: Date,
  raceEnd: Date,
): CheckSegment[] {
  const segments: CheckSegment[] = [];
  let cursor = raceStart;
  let hasRenderedCheckSegment = false;

  for (const [index, check] of checks.entries()) {
    const checkStart = check.serverTs;
    const nextCheckStart = checks[index + 1]?.serverTs ?? raceEnd;
    const segmentStart = max([raceStart, checkStart]);
    const segmentEnd = min([
      raceEnd,
      nextCheckStart,
      addMilliseconds(checkStart, CHECK_VALIDITY_MS),
    ]);

    if (hasRenderedCheckSegment && segmentStart > cursor) {
      segments.push({
        start: cursor,
        end: segmentStart,
        type: "missing",
        colorClass: "bg-warning",
        tooltip: "⚠️",
      });
    }

    if (segmentEnd > segmentStart) {
      const passed = isCheckPassed(check);
      segments.push({
        start: segmentStart,
        end: segmentEnd,
        type: passed ? "passed" : "failed",
        colorClass: passed ? "bg-success" : "bg-error",
        tooltip: passed ? "✅" : "❌",
      });
      hasRenderedCheckSegment = true;
      cursor = segmentEnd;
    } else if (segmentStart > cursor) {
      cursor = segmentStart;
    }
  }

  if (hasRenderedCheckSegment && cursor < raceEnd) {
    segments.push({
      start: cursor,
      end: raceEnd,
      type: "empty",
      colorClass: "bg-base-content/10",
    });
  }

  const firstScoredSegment = segments.find((segment) => segment.type !== "empty");
  if (firstScoredSegment && firstScoredSegment.start > raceStart) {
    segments.unshift({
      start: raceStart,
      end: firstScoredSegment.start,
      type: "empty",
      colorClass: "bg-base-content/10",
    });
  }

  return segments.filter((segment) => segment.end > segment.start);
}

function formatCheckTs(ts?: Date) {
  if (!ts) return "-";

  return intlFormat(ts, { timeStyle: "medium", timeZone: "Europe/Rome" }, { locale: "it-IT" });
}

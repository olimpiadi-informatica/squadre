import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";
import { differenceInMilliseconds, intlFormat } from "date-fns";
import { clamp, countBy, groupBy, minBy, round } from "es-toolkit";
import { maxBy } from "es-toolkit/compat";

import { getTeamInternetChecks, type TeamInternetSegment } from "~/lib/internet-check";
import type { RoundAdminItem } from "~/lib/round";
import { getRoundEndForTeam, getRoundStartForTeam } from "~/lib/round-config";
import {
  computeSessionRecordingStats,
  DEFAULT_GAP_THRESHOLD_MS,
  getRelevantWindow,
  getTeamScreenshotSessions,
  type RecordingSegment,
  type SessionRecordingStats,
} from "~/lib/screenshot";
import { getTeamRoundSubmissions, type TeamRoundSubmission } from "~/lib/submission";
import type { TeamAdminItem } from "~/lib/team";

export async function InternetDetails({
  round,
  team,
}: {
  round: RoundAdminItem;
  team: TeamAdminItem;
}) {
  const contestStart = getRoundStartForTeam(round.startsAt, round.slug, team.delay);
  const contestEnd = getRoundEndForTeam(round.startsAt, round.endsAt, round.slug, team.delay);
  const timelineDurationMs = Math.max(differenceInMilliseconds(contestEnd, contestStart), 1);

  const [segments, submissions, recordingSessions] = await Promise.all([
    getTeamInternetChecks(round.id, team.id),
    getTeamRoundSubmissions(round.id, team.id),
    getTeamScreenshotSessions(team.teamRoundId ?? null, team.slug, DEFAULT_GAP_THRESHOLD_MS),
  ]);

  const contestWindow = { startMs: contestStart.getTime(), endMs: contestEnd.getTime() };
  const relevantWindow = getRelevantWindow(
    contestWindow,
    submissions[0]?.timestamp ?? null,
    submissions[submissions.length - 1]?.timestamp ?? null,
  );
  const recordingStats = recordingSessions.map((session) =>
    computeSessionRecordingStats(session, contestWindow, DEFAULT_GAP_THRESHOLD_MS, relevantWindow),
  );
  const recordingByPc = new Map(recordingStats.map((stats) => [stats.session.id, stats] as const));

  const pcChecks = groupBy(segments, (segment) => segment.pcHash);
  const pcIds = [...new Set([...Object.keys(pcChecks), ...recordingByPc.keys()])];
  const actualChecks = segments.filter(
    (segment) => segment.status === "succeeded" || segment.status === "failed",
  );
  const scoredSegments = segments.filter((segment) => segment.status !== "empty");
  const totalSucceededChecks = segments.filter((segment) => segment.status === "succeeded").length;
  const firstCheck = minBy(actualChecks, (s) => s.startTs.getTime());
  const lastCheck = maxBy(actualChecks, (s) => s.startTs.getTime());
  const lastSubmission = maxBy(submissions, (s) => s.timestamp.getTime());
  const numPc = pcIds.length;
  const maxMissingMs =
    recordingStats.length === 0
      ? 0
      : Math.max(...recordingStats.map((stats) => stats.missingMs), 0);

  return (
    <>
      <Card>
        <CardBody title="Dettagli">
          <div className="grid grid-cols-[repeat(2,auto)] gap-x-4 w-fit">
            <p className="font-semibold">Controlli:</p>
            <p>
              {totalSucceededChecks} / {scoredSegments.length}
            </p>
            <p className="font-semibold">PC monitorati:</p>
            <p>{numPc}</p>
            <p className="font-semibold">Registrazioni:</p>
            <p>
              {recordingStats.length} PC
              {maxMissingMs > 0 ? ` · ${formatMissingDuration(maxMissingMs)} mancanti` : ""}
            </p>
            <p className="font-semibold">Intervallo gara:</p>
            <p>
              {formatCheckTs(contestStart)} - {formatCheckTs(contestEnd)}
            </p>
            <p className="font-semibold">Primo check:</p>
            <p>{formatCheckTs(firstCheck?.startTs)}</p>
            <p className="font-semibold">Ultimo check:</p>
            <p>{formatCheckTs(lastCheck?.startTs)}</p>
            <p className="font-semibold">Ultima submission:</p>
            <p>{formatCheckTs(lastSubmission?.timestamp)}</p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4">
        {pcIds.map((pc) => (
          <PcInternet
            key={pc}
            pcHash={pc}
            segments={pcChecks[pc] ?? []}
            recording={recordingByPc.get(pc)}
            contestStart={contestStart}
            timelineDurationMs={timelineDurationMs}
            submissions={submissions}
          />
        ))}
      </div>
    </>
  );
}

function PcInternet({
  pcHash,
  segments,
  recording,
  contestStart,
  timelineDurationMs,
  submissions,
}: {
  pcHash: string;
  segments: TeamInternetSegment[];
  recording: SessionRecordingStats | undefined;
  contestStart: Date;
  timelineDurationMs: number;
  submissions: TeamRoundSubmission[];
}) {
  const scoredSegments = segments.filter((segment) => segment.status !== "empty");
  const pcInfo = segments[0];
  const totalChecks = scoredSegments.length;
  const checkTypes = countBy(scoredSegments, (segment) => segment.status);
  const successRate =
    totalChecks === 0 ? 0 : round(((checkTypes.succeeded ?? 0) / totalChecks) * 100, 1);

  return (
    <div className="p-3 border border-base-content/10 rounded-lg bg-base-200">
      <div className="mb-3">
        <h2 className="font-semibold">
          PC: <code>{pcHash.slice(0, 8)}</code>
        </h2>
        {(pcInfo?.browserName || pcInfo?.osName) && (
          <div className="grid grid-cols-[repeat(2,auto)] gap-x-3 text-sm opacity-80">
            <p className="font-semibold">Browser:</p>
            <p>
              {pcInfo?.browserName ?? "-"} {pcInfo?.browserMajor ?? ""}
            </p>
            <p className="font-semibold">OS:</p>
            <p>{pcInfo?.osName ?? "-"}</p>
          </div>
        )}
      </div>

      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">Internet</span>
        {totalChecks > 0 ? (
          <span>
            success rate: <span className="font-semibold">{successRate}%</span> | succeeded:{" "}
            {checkTypes.succeeded ?? 0} | failed: {checkTypes.failed ?? 0} | missing:{" "}
            {checkTypes.missing ?? 0}
          </span>
        ) : (
          <span className="opacity-60">nessun controllo</span>
        )}
      </div>

      {segments.length > 0 && (
        <div className="h-5 flex w-full rounded border border-base-300 bg-base-200">
          {segments.map((segment, index) => {
            const width =
              differenceInMilliseconds(segment.endTs, segment.startTs) / timelineDurationMs;
            const isEmptySegment = segment.status === "empty";

            return (
              <div
                key={index}
                className={clsx(
                  "h-full",
                  getInternetColorClass(segment.status),
                  !isEmptySegment && "tooltip",
                )}
                data-tip={
                  isEmptySegment
                    ? undefined
                    : `${formatCheckTs(segment.startTs)} ${formatInternetLabel(segment.status)}`
                }
                style={{ width: `${width * 100}%` }}
              />
            );
          })}
        </div>
      )}

      <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">Registrazione</span>
        {recording ? (
          <span>
            coverage: <span className="font-semibold">{round(recording.coverage * 100, 1)}%</span> |
            frames: {recording.framesInRelevantWindow} | missing:{" "}
            {recording.missingMs > 0 ? formatMissingDuration(recording.missingMs) : "0"}
          </span>
        ) : (
          <span className="opacity-60">nessuna registrazione</span>
        )}
      </div>

      {recording ? (
        <div className="h-5 flex w-full rounded border border-base-300 bg-base-200">
          {recording.segments.map((segment, index) => {
            const width =
              differenceInMilliseconds(segment.endMs, segment.startMs) / timelineDurationMs;
            const isEmptySegment = segment.status === "empty";

            return (
              <div
                key={index}
                className={clsx(
                  "h-full",
                  getRecordingColorClass(segment.status),
                  !isEmptySegment && "tooltip",
                )}
                data-tip={
                  isEmptySegment
                    ? undefined
                    : `${formatCheckTs(new Date(segment.startMs))} ${getRecordingLabel(
                        segment.status,
                      )}`
                }
                style={{ width: `${width * 100}%` }}
              />
            );
          })}
        </div>
      ) : null}

      {submissions.length > 0 && (
        <div className="relative h-4 mt-2">
          {submissions.map((submission, index) => {
            const left = clamp(
              (differenceInMilliseconds(submission.timestamp, contestStart) / timelineDurationMs) *
                100,
              0,
              100,
            );

            return (
              <div
                key={`${submission.taskSlug}-${submission.timestamp.toISOString()}-${index}`}
                className="tooltip absolute -translate-x-1/2"
                data-tip={`${formatCheckTs(submission.timestamp)} ${submission.taskSlug}`}
                style={{ left: `${left}%` }}>
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-info border border-info-content/20" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getInternetColorClass(status: TeamInternetSegment["status"]) {
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

function getRecordingColorClass(status: RecordingSegment["status"]) {
  switch (status) {
    case "recorded":
      return "bg-success";
    case "gap":
      return "bg-error";
    case "empty":
      return "bg-base-content/10";
  }
}

function formatInternetLabel(status: TeamInternetSegment["status"]) {
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

function getRecordingLabel(status: RecordingSegment["status"]) {
  switch (status) {
    case "recorded":
      return "registrato";
    case "gap":
      return "mancante";
    case "empty":
      return "";
  }
}

function formatCheckTs(ts?: Date) {
  if (!ts) return "-";

  return intlFormat(ts, { timeStyle: "medium", timeZone: "Europe/Rome" }, { locale: "it-IT" });
}

function formatMissingDuration(ms: number) {
  const totalMinutes = Math.max(Math.round(ms / 60_000), 1);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

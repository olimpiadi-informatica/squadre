import { Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";
import { differenceInMilliseconds, intlFormat } from "date-fns";
import { clamp, countBy, groupBy, minBy, round } from "es-toolkit";
import { maxBy } from "es-toolkit/compat";

import { getTeamInternetChecks, type TeamInternetSegment } from "~/lib/internet-check";
import {
  getProctoringUnavailable,
  overlapMs,
  splitWindow,
  unavailableForTeam,
} from "~/lib/proctoring-unavailable";
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

/**
 * `unavailable` non è uno stato salvato nel database: indica i tratti in cui il
 * proctoring non stava raccogliendo (vedi `proctoring_unavailable`) e viene
 * calcolato al volo.
 */
type DisplayStatus = TeamInternetSegment["status"] | "unavailable";
type DisplaySegment = Omit<TeamInternetSegment, "status"> & { status: DisplayStatus };

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

  const [rawSegments, submissions, recordingSessions, unavailable] = await Promise.all([
    getTeamInternetChecks(round.id, team.id),
    getTeamRoundSubmissions(round.id, team.id),
    getTeamScreenshotSessions(team.teamRoundId ?? null, team.slug, DEFAULT_GAP_THRESHOLD_MS),
    getProctoringUnavailable(round.id),
  ]);

  const unavailableWindows = unavailableForTeam(unavailable, team.id);
  // La finestra "non disponibile" vince su qualunque altro stato, anche su
  // `empty`: altrimenti il periodo prima della prima submission nasconderebbe
  // il tratteggio e le due barre non coinciderebbero.
  //
  // Uno stato fuori dalla lista è una riga storica (es. lo script che segnava a
  // mano `unavailable` nel database): la riportiamo a `missing`, che è quello
  // che era, invece di disegnarla come non disponibile.
  const segments: DisplaySegment[] = rawSegments.flatMap((segment): DisplaySegment[] =>
    splitWindow(segment.startTs.getTime(), segment.endTs.getTime(), unavailableWindows).map(
      (piece) => ({
        ...segment,
        startTs: new Date(piece.startMs),
        endTs: new Date(piece.endMs),
        status: piece.unavailable ? "unavailable" : normalizeStatus(segment.status),
      }),
    ),
  );

  const contestWindow = { startMs: contestStart.getTime(), endMs: contestEnd.getTime() };
  const relevantWindow = getRelevantWindow(
    contestWindow,
    submissions[0]?.timestamp ?? null,
    submissions[submissions.length - 1]?.timestamp ?? null,
  );
  const recordingStats = recordingSessions.map((session) =>
    computeSessionRecordingStats(
      session,
      contestWindow,
      DEFAULT_GAP_THRESHOLD_MS,
      relevantWindow,
      unavailableWindows,
    ),
  );
  const recordingByPc = new Map(recordingStats.map((stats) => [stats.session.id, stats] as const));

  const pcChecks = groupBy(segments, (segment) => segment.pcHash);
  const pcIds = [...new Set([...Object.keys(pcChecks), ...recordingByPc.keys()])];
  const actualChecks = segments.filter(
    (segment) => segment.status === "succeeded" || segment.status === "failed",
  );
  const scoredSegments = segments.filter((segment) => isScoredStatus(segment.status));
  const totalSucceededChecks = segments.filter((segment) => segment.status === "succeeded").length;
  const firstCheck = minBy(actualChecks, (s) => s.startTs.getTime());
  const lastCheck = maxBy(actualChecks, (s) => s.startTs.getTime());
  const lastSubmission = maxBy(submissions, (s) => s.timestamp.getTime());
  const numPc = pcIds.length;

  // Un PC che ha fatto controlli internet ma non ha inviato nessun frame non
  // compare tra le sessioni: la sua registrazione manca per intero.
  const recordedPcIds = new Set(recordingStats.map((stats) => stats.session.id));
  const missingPcIds = pcIds.filter((pc) => !recordedPcIds.has(pc));
  const unavailableMs = overlapMs(relevantWindow.startMs, relevantWindow.endMs, unavailableWindows);
  const availableMs = Math.max(relevantWindow.endMs - relevantWindow.startMs - unavailableMs, 0);
  const missingMs =
    recordingStats.reduce((sum, stats) => sum + stats.missingMs, 0) +
    missingPcIds.length * availableMs;

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
              {missingPcIds.length > 0 && (
                <span className="text-error"> · {missingPcIds.length} PC senza registrazione</span>
              )}
              {missingMs > 0 ? ` · ${formatMissingDuration(missingMs)} mancanti` : ""}
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
            noRecordingIsIssue={availableMs > 0}
            unavailableMs={unavailableMs}
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
  noRecordingIsIssue,
  unavailableMs,
  contestStart,
  timelineDurationMs,
  submissions,
}: {
  pcHash: string;
  segments: DisplaySegment[];
  recording: SessionRecordingStats | undefined;
  /** `false` se nel periodo utile il proctoring non stava raccogliendo. */
  noRecordingIsIssue: boolean;
  /** Tempo non disponibile dentro il periodo utile (uguale per tutti i PC). */
  unavailableMs: number;
  contestStart: Date;
  timelineDurationMs: number;
  submissions: TeamRoundSubmission[];
}) {
  const scoredSegments = segments.filter((segment) => isScoredStatus(segment.status));
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
            {unavailableMs > 0 && <> | non disponibili: {formatMissingDuration(unavailableMs)}</>}
          </span>
        ) : unavailableMs > 0 ? (
          <span className="opacity-60">
            nessun controllo · non disponibili: {formatMissingDuration(unavailableMs)}
          </span>
        ) : (
          <span className="opacity-60">nessun controllo</span>
        )}
      </div>

      {segments.length > 0 && (
        <div className="timeline-unavailable h-5 flex w-full rounded border border-base-300 bg-base-200">
          {segments.map((segment, index) => {
            const width =
              differenceInMilliseconds(segment.endTs, segment.startTs) / timelineDurationMs;
            const isEmptySegment = segment.status === "empty";

            return (
              <div
                key={index}
                className={clsx(
                  // `grow`: le larghezze percentuali vengono arrotondate al
                  // pixel, con centinaia di segmenti l'errore si accumula e
                  // lascia qualche px scoperti a destra (dove si vedrebbe il
                  // tratteggio del contenitore). Con `grow` i segmenti assorbono
                  // l'arrotondamento e riempiono esattamente la barra.
                  "h-full grow",
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
            {recording.unavailableMs > 0 && (
              <> | non disponibili: {formatMissingDuration(recording.unavailableMs)}</>
            )}
          </span>
        ) : (
          <span className={clsx(noRecordingIsIssue ? "font-semibold text-error" : "opacity-60")}>
            nessuna registrazione
          </span>
        )}
      </div>

      {recording ? (
        <div className="timeline-unavailable h-5 flex w-full rounded border border-base-300 bg-base-200">
          {recording.segments.map((segment, index) => {
            const width =
              differenceInMilliseconds(segment.endMs, segment.startMs) / timelineDurationMs;
            const isEmptySegment = segment.status === "empty";

            return (
              <div
                key={index}
                className={clsx(
                  "h-full grow",
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

function getInternetColorClass(status: DisplayStatus) {
  switch (status) {
    case "succeeded":
      return "bg-success";
    case "failed":
      return "bg-error";
    case "missing":
      return "bg-warning";
    case "empty":
      return "timeline-empty";
    case "unavailable":
      // Trasparente: lascia vedere il tratteggio della barra.
      return "bg-transparent";
  }
}

function getRecordingColorClass(status: RecordingSegment["status"]) {
  switch (status) {
    case "recorded":
      return "bg-success";
    case "gap":
      return "bg-error";
    case "empty":
      return "timeline-empty";
    case "unavailable":
      return "bg-transparent";
  }
}

function formatInternetLabel(status: DisplayStatus) {
  switch (status) {
    case "succeeded":
      return "✅";
    case "failed":
      return "❌";
    case "missing":
      return "⚠️";
    case "unavailable":
      return "non disponibile";
    case "empty":
      return "";
  }
}

function isScoredStatus(status: DisplayStatus) {
  return status !== "empty" && status !== "unavailable";
}

const KNOWN_STATUSES: TeamInternetSegment["status"][] = ["succeeded", "failed", "missing", "empty"];

function normalizeStatus(status: TeamInternetSegment["status"]): TeamInternetSegment["status"] {
  return KNOWN_STATUSES.includes(status) ? status : "missing";
}

function getRecordingLabel(status: RecordingSegment["status"]) {
  switch (status) {
    case "recorded":
      return "registrato";
    case "gap":
      return "mancante";
    case "unavailable":
      return "non disponibile";
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

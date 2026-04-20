import { hash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { addSeconds, clamp, max, min } from "date-fns";
import { groupBy, isPlainObject, sortBy } from "es-toolkit";
import { UAParser } from "ua-parser-js";
import { z } from "zod";

import type { InternetCheckStatus, internetCheck } from "~/lib/db/schema";
import type { RoundAdminItem } from "~/lib/round";
import { getRoundEndForTeam, getRoundStartForTeam } from "~/lib/round-config";
import type { TeamCredential } from "~/lib/team";

const CHECK_VALIDITY_SEC = 100;

type InternetCheckInsert = typeof internetCheck.$inferInsert;

type ParsedInternetCheck = {
  ts: Date;
  serverTs: Date;
  ic: boolean[];
  pcHash: string;
  userAgent: string | null;
  browserName: string | null;
  browserMajor: number | null;
  osName: string | null;
};

export async function processInternetChecks(
  internetPath: string,
  roundData: RoundAdminItem,
  teams: Record<string, TeamCredential>,
  lastSubmissionByTeamRoundId: Record<number, Date | undefined>,
) {
  const rows: InternetCheckInsert[] = [];
  const rawChecksByTeam = new Map<string, ParsedInternetCheck[]>();
  const teamSlugs = await readdir(internetPath);

  for (const teamSlug of teamSlugs) {
    if (teams[teamSlug] == null) continue;

    const jsonlPath = path.join(internetPath, teamSlug, "internet.json");
    const content = await readFile(jsonlPath, "utf8");
    const lines = content.split(/\r?\n/);
    const checks: ParsedInternetCheck[] = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim();
      if (!line) continue;

      try {
        const parsedLine = internetCheckLineSchema.parse(JSON.parse(line));
        const userAgent = parsedLine.fp?.basicInfo?.userAgent ?? null;
        const parsedUserAgent = parseUserAgent(userAgent);

        checks.push({
          ts: new Date(parsedLine.ts),
          serverTs: new Date(parsedLine.server_ts),
          ic: parsedLine.ic,
          pcHash: getPcHash(parsedLine),
          userAgent,
          ...parsedUserAgent,
        });
      } catch (error) {
        throw new Error(`Errore nel file ${jsonlPath} alla riga ${index + 1}`, { cause: error });
      }
    }

    rawChecksByTeam.set(teamSlug, sortBy(checks, ["serverTs"]));
  }

  for (const [teamSlug, team] of Object.entries(teams)) {
    rows.push(
      ...buildTeamInternetChecks(rawChecksByTeam.get(teamSlug) ?? [], roundData, team, {
        lastSubmissionTs: lastSubmissionByTeamRoundId[team.teamRoundId],
      }),
    );
  }

  return rows;
}

function buildTeamInternetChecks(
  checks: ParsedInternetCheck[],
  roundData: RoundAdminItem,
  team: TeamCredential,
  options: {
    lastSubmissionTs?: Date;
  },
): InternetCheckInsert[] {
  const contestStart = getRoundStartForTeam(roundData.startsAt, roundData.slug, team.delay);
  const contestEnd = getRoundEndForTeam(
    roundData.startsAt,
    roundData.endsAt,
    roundData.slug,
    team.delay,
  );
  const checksByPc = groupBy(checks, (check) => check.pcHash);

  return Object.values(checksByPc).flatMap((pcChecks) =>
    buildPcInternetChecks(pcChecks, {
      teamRoundId: team.teamRoundId,
      contestStart,
      contestEnd,
      lastSubmissionTs: options.lastSubmissionTs,
    }),
  );
}

function buildPcInternetChecks(
  checks: ParsedInternetCheck[],
  context: {
    teamRoundId: number;
    contestStart: Date;
    contestEnd: Date;
    lastSubmissionTs?: Date;
  },
): InternetCheckInsert[] {
  const { contestStart, contestEnd, lastSubmissionTs } = context;
  const checksDuringRace = checks.filter(
    (check) => check.serverTs >= contestStart && check.serverTs <= contestEnd,
  );
  const lastPreStartCheck = checks.findLast((check) => check.serverTs < contestStart);
  const effectiveChecks = [...checksDuringRace];

  if (
    lastPreStartCheck &&
    addSeconds(lastPreStartCheck.serverTs, CHECK_VALIDITY_SEC) > contestStart
  ) {
    effectiveChecks.unshift(lastPreStartCheck);
  }

  if (effectiveChecks.length === 0) {
    return [];
  }

  const pcMeta = effectiveChecks[0];
  const rows: InternetCheckInsert[] = [];
  let cursor = contestStart;
  let hasRenderedCheckSegment = false;
  const lastRelevantTs =
    lastSubmissionTs == null
      ? contestEnd
      : clamp(lastSubmissionTs, { start: contestStart, end: contestEnd });

  for (const [index, check] of effectiveChecks.entries()) {
    const checkStart = check.serverTs;
    const nextCheckStart = effectiveChecks[index + 1]?.serverTs ?? contestEnd;
    const segmentStart = max([contestStart, checkStart]);
    const segmentEnd = min([
      contestEnd,
      nextCheckStart,
      addSeconds(checkStart, CHECK_VALIDITY_SEC),
    ]);

    if (hasRenderedCheckSegment && segmentStart > cursor) {
      rows.push(
        ...createGapRows(pcMeta, context.teamRoundId, {
          startTs: cursor,
          endTs: segmentStart,
          lastRelevantTs,
          chunkSizeSec: CHECK_VALIDITY_SEC,
        }),
      );
    }

    if (segmentEnd > segmentStart) {
      rows.push(
        createCheckRow(check, context.teamRoundId, {
          startTs: segmentStart,
          endTs: segmentEnd,
          status: getCheckStatus(check.ic),
        }),
      );
      hasRenderedCheckSegment = true;
      cursor = segmentEnd;
    } else if (segmentStart > cursor) {
      cursor = segmentStart;
    }
  }

  if (hasRenderedCheckSegment && cursor < contestEnd) {
    rows.push(
      ...createGapRows(pcMeta, context.teamRoundId, {
        startTs: cursor,
        endTs: contestEnd,
        lastRelevantTs,
        chunkSizeSec: CHECK_VALIDITY_SEC,
      }),
    );
  }

  const firstScoredRow = rows.find((row) => row.status !== "empty");
  if (firstScoredRow && firstScoredRow.startTs > contestStart) {
    rows.unshift(
      createSyntheticRow(pcMeta, context.teamRoundId, {
        startTs: contestStart,
        endTs: firstScoredRow.startTs,
        status: "empty",
      }),
    );
  }

  return rows.filter((row) => row.endTs > row.startTs);
}

function createCheckRow(
  check: ParsedInternetCheck,
  teamRoundId: number,
  segment: {
    startTs: Date;
    endTs: Date;
    status: InternetCheckStatus;
  },
): InternetCheckInsert {
  return {
    teamRoundId: teamRoundId,
    startTs: segment.startTs,
    endTs: segment.endTs,
    status: segment.status,
    pcHash: check.pcHash,
    userAgent: check.userAgent,
    browserName: check.browserName,
    browserMajor: check.browserMajor,
    osName: check.osName,
  };
}

function createSyntheticRow(
  pcMeta: ParsedInternetCheck,
  teamRoundId: number,
  segment: {
    startTs: Date;
    endTs: Date;
    status: Extract<InternetCheckStatus, "missing" | "empty">;
  },
): InternetCheckInsert {
  return {
    teamRoundId: teamRoundId,
    startTs: segment.startTs,
    endTs: segment.endTs,
    status: segment.status,
    pcHash: pcMeta.pcHash,
    userAgent: pcMeta.userAgent,
    browserName: pcMeta.browserName,
    browserMajor: pcMeta.browserMajor,
    osName: pcMeta.osName,
  };
}

function createGapRows(
  pcMeta: ParsedInternetCheck,
  teamRoundId: number,
  segment: {
    startTs: Date;
    endTs: Date;
    lastRelevantTs: Date;
    chunkSizeSec: number;
  },
): InternetCheckInsert[] {
  const rows: InternetCheckInsert[] = [];
  const missingEnd = min([segment.endTs, segment.lastRelevantTs]);

  if (missingEnd > segment.startTs) {
    rows.push(
      ...createChunkedSyntheticRows(pcMeta, teamRoundId, {
        startTs: segment.startTs,
        endTs: missingEnd,
        status: "missing",
        chunkSizeSec: segment.chunkSizeSec,
      }),
    );
  }

  const emptyStart = max([segment.startTs, segment.lastRelevantTs]);
  if (segment.endTs > emptyStart) {
    rows.push(
      createSyntheticRow(pcMeta, teamRoundId, {
        startTs: emptyStart,
        endTs: segment.endTs,
        status: "empty",
      }),
    );
  }

  return rows;
}

function createChunkedSyntheticRows(
  pcMeta: ParsedInternetCheck,
  teamRoundId: number,
  segment: {
    startTs: Date;
    endTs: Date;
    status: "missing";
    chunkSizeSec: number;
  },
): InternetCheckInsert[] {
  const rows: InternetCheckInsert[] = [];
  let cursor = segment.startTs;

  while (cursor < segment.endTs) {
    const chunkEnd = min([segment.endTs, addSeconds(cursor, segment.chunkSizeSec)]);
    rows.push(
      createSyntheticRow(pcMeta, teamRoundId, {
        startTs: cursor,
        endTs: chunkEnd,
        status: segment.status,
      }),
    );
    cursor = chunkEnd;
  }

  return rows;
}

function getCheckStatus(ic: boolean[]): Extract<InternetCheckStatus, "succeeded" | "failed"> {
  return ic.every(Boolean) ? "succeeded" : "failed";
}

function parseUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return {
      browserName: null,
      browserMajor: null,
      osName: null,
    };
  }

  const parsed = new UAParser(userAgent).getResult();
  const browserMajor = parsed.browser.major ? Number(parsed.browser.major) : null;

  return {
    browserName: parsed.browser.name ?? null,
    browserMajor: Number.isNaN(browserMajor) ? null : browserMajor,
    osName: parsed.os.name ?? null,
  };
}

function getPcHash(entry: InternetCheckLine): string {
  const stableData = stableStringify(entry.fp);
  return hash("sha256", stableData);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = sortBy(Object.entries(value), ["0"]);
    return `{${entries
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

const internetCheckLineSchema = z.strictObject({
  ts: z.number().int(),
  ic: z.array(z.boolean()),
  server_ts: z.number().int(),
  mid: z.string(),
  fp: z.looseObject({
    basicInfo: z
      .looseObject({
        userAgent: z.string().optional(),
      })
      .optional(),
  }),
});

type InternetCheckLine = z.infer<typeof internetCheckLineSchema>;

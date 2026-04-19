import { hash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { addSeconds, max, min } from "date-fns";
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
    rows.push(...buildTeamInternetChecks(rawChecksByTeam.get(teamSlug) ?? [], roundData, team));
  }

  return rows;
}

function buildTeamInternetChecks(
  checks: ParsedInternetCheck[],
  roundData: RoundAdminItem,
  team: TeamCredential,
): InternetCheckInsert[] {
  const raceStart = getRoundStartForTeam(roundData.startsAt, roundData.slug, team.delay);
  const raceEnd = getRoundEndForTeam(
    roundData.startsAt,
    roundData.endsAt,
    roundData.slug,
    team.delay,
  );
  const checksByPc = groupBy(checks, (check) => check.pcHash);

  return Object.values(checksByPc).flatMap((pcChecks) =>
    buildPcInternetChecks(pcChecks, {
      teamId: team.id,
      roundId: roundData.id,
      raceStart,
      raceEnd,
    }),
  );
}

function buildPcInternetChecks(
  checks: ParsedInternetCheck[],
  context: {
    teamId: number;
    roundId: number;
    raceStart: Date;
    raceEnd: Date;
  },
): InternetCheckInsert[] {
  const { raceStart, raceEnd } = context;
  const checksDuringRace = checks.filter(
    (check) => check.serverTs >= raceStart && check.serverTs <= raceEnd,
  );
  const lastPreStartCheck = checks.findLast((check) => check.serverTs < raceStart);
  const effectiveChecks = [...checksDuringRace];

  if (lastPreStartCheck && addSeconds(lastPreStartCheck.serverTs, CHECK_VALIDITY_SEC) > raceStart) {
    effectiveChecks.unshift(lastPreStartCheck);
  }

  if (effectiveChecks.length === 0) {
    return [];
  }

  const pcMeta = effectiveChecks[0];
  const rows: InternetCheckInsert[] = [];
  let cursor = raceStart;
  let hasRenderedCheckSegment = false;

  for (const [index, check] of effectiveChecks.entries()) {
    const checkStart = check.serverTs;
    const nextCheckStart = effectiveChecks[index + 1]?.serverTs ?? raceEnd;
    const segmentStart = max([raceStart, checkStart]);
    const segmentEnd = min([raceEnd, nextCheckStart, addSeconds(checkStart, CHECK_VALIDITY_SEC)]);

    if (hasRenderedCheckSegment && segmentStart > cursor) {
      rows.push(
        ...createChunkedSyntheticRows(pcMeta, context, {
          startTs: cursor,
          endTs: segmentStart,
          status: "missing",
          chunkSizeSec: CHECK_VALIDITY_SEC,
        }),
      );
    }

    if (segmentEnd > segmentStart) {
      rows.push(
        createCheckRow(check, context, {
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

  if (hasRenderedCheckSegment && cursor < raceEnd) {
    rows.push(
      createSyntheticRow(pcMeta, context, {
        startTs: cursor,
        endTs: raceEnd,
        status: "empty",
      }),
    );
  }

  const firstScoredRow = rows.find((row) => row.status !== "empty");
  if (firstScoredRow && firstScoredRow.startTs > raceStart) {
    rows.unshift(
      createSyntheticRow(pcMeta, context, {
        startTs: raceStart,
        endTs: firstScoredRow.startTs,
        status: "empty",
      }),
    );
  }

  return rows.filter((row) => row.endTs > row.startTs);
}

function createCheckRow(
  check: ParsedInternetCheck,
  context: { teamId: number; roundId: number },
  segment: {
    startTs: Date;
    endTs: Date;
    status: InternetCheckStatus;
  },
): InternetCheckInsert {
  return {
    teamId: context.teamId,
    roundId: context.roundId,
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
  context: { teamId: number; roundId: number },
  segment: {
    startTs: Date;
    endTs: Date;
    status: Extract<InternetCheckStatus, "missing" | "empty">;
  },
): InternetCheckInsert {
  return {
    teamId: context.teamId,
    roundId: context.roundId,
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

function createChunkedSyntheticRows(
  pcMeta: ParsedInternetCheck,
  context: { teamId: number; roundId: number },
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
      createSyntheticRow(pcMeta, context, {
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

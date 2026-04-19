import { addHours, addMinutes, addSeconds, differenceInMinutes, subMinutes } from "date-fns";

const DEFAULT_ROUND_DURATION_HOURS = 3;

export function isPracticeRound(slug: string): boolean {
  return slug === "practice";
}

export function roundHasDelay(slug: string): boolean {
  return /^\d+$/.test(slug);
}

export function getRoundStartForTeam(startsAt: Date, slug: string, delaySeconds = 0): Date {
  const baseStart = roundHasDelay(slug) ? subMinutes(startsAt, 5) : startsAt;
  return addSeconds(baseStart, delaySeconds);
}

export function getDefaultRoundEndsAt(startsAt: Date, slug: string): Date {
  return addHours(getRoundStartForTeam(startsAt, slug), DEFAULT_ROUND_DURATION_HOURS);
}

export function getRoundDurationMinutes(startsAt: Date, endsAt: Date, slug: string): number {
  return differenceInMinutes(endsAt, getRoundStartForTeam(startsAt, slug));
}

export function getRoundEndForTeam(
  startsAt: Date,
  endsAt: Date,
  slug: string,
  delaySeconds = 0,
): Date {
  return addMinutes(
    getRoundStartForTeam(startsAt, slug, delaySeconds),
    getRoundDurationMinutes(startsAt, endsAt, slug),
  );
}

export function shouldPublishRound(slug: string): boolean {
  return !isPracticeRound(slug);
}

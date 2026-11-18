import { getTeamRoundInternetChecks } from "./internet-check";
import { listRoundRecordings } from "./screenshot";

export type ProctoringInternetStats = {
  numPc: number;
  numChecks: number;
  numSucceededChecks: number;
  numFailedChecks: number;
  numMissingChecks: number;
  hasIssues: boolean;
};

export type ProctoringRecordingStats = {
  numSessions: number;
  totalFrames: number;
  missingMs: number;
  numGaps: number;
  largestGapMs: number;
  hasIssues: boolean;
};

export type ProctoringTeamRow = {
  teamSlug: string;
  teamName: string;
  instituteName: string;
  instituteCity: string;
  numPc: number;
  internet: ProctoringInternetStats | null;
  recording: ProctoringRecordingStats | null;
  hasIssues: boolean;
};

export async function listRoundProctoring(
  editionId: string,
  roundSlug: string,
): Promise<ProctoringTeamRow[]> {
  const [internetTeams, recordingTeams] = await Promise.all([
    getTeamRoundInternetChecks(editionId, roundSlug),
    listRoundRecordings(editionId, roundSlug),
  ]);

  const rows = new Map<string, ProctoringTeamRow>();

  for (const team of recordingTeams) {
    const missingMs =
      team.numSessions === 0
        ? Math.max(team.relevantWindow.endMs - team.relevantWindow.startMs, 0)
        : Math.max(...team.sessionStats.map((stats) => stats.missingMs), 0);

    rows.set(team.teamSlug, {
      teamSlug: team.teamSlug,
      teamName: team.teamName,
      instituteName: team.instituteName,
      instituteCity: team.instituteCity,
      numPc: team.numSessions,
      internet: null,
      recording: {
        numSessions: team.numSessions,
        totalFrames: team.totalFrames,
        missingMs,
        numGaps: team.numGaps,
        largestGapMs: team.largestGapMs,
        hasIssues: team.hasIssues,
      },
      hasIssues: team.hasIssues,
    });
  }

  for (const team of internetTeams) {
    const existing = rows.get(team.teamSlug);
    const internet = {
      numPc: team.numPc,
      numChecks: team.numChecks,
      numSucceededChecks: team.numSucceededChecks,
      numFailedChecks: team.numFailedChecks,
      numMissingChecks: team.numMissingChecks,
      hasIssues: team.hasIssues,
    };

    if (existing) {
      existing.internet = internet;
      existing.numPc = Math.max(existing.numPc, team.numPc);
      existing.hasIssues = existing.hasIssues || team.hasIssues;
    } else {
      rows.set(team.teamSlug, {
        teamSlug: team.teamSlug,
        teamName: team.teamName,
        instituteName: team.instituteName,
        instituteCity: team.instituteCity,
        numPc: team.numPc,
        internet,
        recording: null,
        hasIssues: team.hasIssues,
      });
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      a.instituteName.localeCompare(b.instituteName) ||
      a.instituteCity.localeCompare(b.instituteCity) ||
      a.teamName.localeCompare(b.teamName),
  );
}

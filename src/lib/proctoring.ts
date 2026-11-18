import type { PenalizationLevel } from "./db/schema";
import { getTeamRoundInternetChecks } from "./internet-check";
import { listRoundRecordings, type RecordingPenalization } from "./screenshot";

export type ProctoringInternetStats = {
  numPc: number;
  numChecks: number;
  numSucceededChecks: number;
  numFailedChecks: number;
  numMissingChecks: number;
  hasIssues: boolean;
};

export type ProctoringRecordingStats = {
  /** PC che hanno inviato almeno un frame. */
  numSessions: number;
  /** PC monitorati che non hanno inviato nemmeno un frame. */
  numMissingPcs: number;
  totalFrames: number;
  /** Somma del tempo mancante su tutti i PC. */
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
  /** Livello della penalizzazione di proctoring più grave, se presente. */
  penalization: PenalizationLevel | null;
  hasIssues: boolean;
};

/**
 * Solo le penalizzazioni di tipo proctoring riguardano questa pagina; le altre
 * (plagio, AI, ...) non vengono mostrate. Un rosso prevale su un giallo.
 */
function worstPenalizationLevel(penalizations: RecordingPenalization[]): PenalizationLevel | null {
  const levels = penalizations
    .filter((item) => item.type === "proctoring")
    .map((item) => item.level);

  if (levels.includes("red")) return "red";
  if (levels.length > 0) return "yellow";
  return null;
}

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
    rows.set(team.teamSlug, {
      teamSlug: team.teamSlug,
      teamName: team.teamName,
      instituteName: team.instituteName,
      instituteCity: team.instituteCity,
      numPc: team.numSessions,
      internet: null,
      recording: {
        numSessions: team.numSessions,
        numMissingPcs: team.missingPcs.length,
        totalFrames: team.totalFrames,
        missingMs: team.missingMs,
        numGaps: team.numGaps,
        largestGapMs: team.largestGapMs,
        hasIssues: team.hasIssues,
      },
      penalization: worstPenalizationLevel(team.penalizations),
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
        penalization: null,
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

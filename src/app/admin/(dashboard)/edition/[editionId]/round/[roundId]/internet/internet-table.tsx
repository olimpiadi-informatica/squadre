"use client";

import Link from "next/link";
import { useCallback } from "react";

import { CheckboxField, Form, NumberField } from "@olinfo/react-components";
import clsx from "clsx";

import { Table } from "~/components/table";
import type { TeamRoundInternetCheck } from "~/lib/internet-check";

const DEFAULT_ONLY_ISSUES = true;
const DEFAULT_MISSING_THRESHOLD = 5;
const DEFAULT_FAILED_THRESHOLD = 1;

function showTeam(
  item: TeamRoundInternetCheck,
  onlyIssues: boolean = DEFAULT_ONLY_ISSUES,
  missingThreshold: number = DEFAULT_MISSING_THRESHOLD,
  failThreshold: number = DEFAULT_FAILED_THRESHOLD,
) {
  if (!onlyIssues) return true;
  return (
    item.numFailedChecks >= failThreshold ||
    item.numChecks === 0 ||
    item.numPc > 2 ||
    item.numMissingChecks >= missingThreshold
  );
}

function InternetTeamRoundRow({
  item,
  missingThreshold,
  failedThreshold,
}: {
  item: TeamRoundInternetCheck;
  missingThreshold: number;
  failedThreshold: number;
}) {
  const hasTooManyPc = item.numPc > 2;
  const hasFailedIssues = item.numFailedChecks >= failedThreshold;
  const hasFailedWarning = item.numFailedChecks > 0 && item.numFailedChecks < failedThreshold;
  const hasMissingIssues = item.numMissingChecks >= missingThreshold;
  const hasMissingWarning = item.numMissingChecks > 0 && item.numMissingChecks < missingThreshold;

  return (
    <>
      <div>{item.teamSlug}</div>
      <div className="min-w-32 text-wrap break-words">{item.teamName}</div>
      <div className="min-w-48 text-wrap break-words">
        {item.instituteName}, {item.instituteCity}
      </div>
      <div className={clsx(hasTooManyPc && "font-semibold text-error")}>{item.numPc}</div>
      <div>
        <div>
          {item.numSucceededChecks} / {item.numChecks}
        </div>
        <div className="text-xs opacity-70">
          {item.numChecks === 0 ? (
            "nessun check"
          ) : (
            <>
              <span
                className={clsx(
                  hasFailedIssues && "font-semibold text-error",
                  hasFailedWarning && "font-semibold text-warning",
                )}>
                fail {item.numFailedChecks}
              </span>
              <span> · </span>
              <span
                className={clsx(
                  hasMissingIssues && "font-semibold text-error",
                  hasMissingWarning && "font-semibold text-warning",
                )}>
                missing {item.numMissingChecks}
              </span>
            </>
          )}
        </div>
      </div>
      <div>
        <Link
          href={`/admin/edition/${item.editionId}/round/${item.roundSlug}/internet/${item.teamSlug}`}
          className="btn btn-primary btn-xs">
          Dettaglio
        </Link>
      </div>
    </>
  );
}

export function InternetTable({ teams }: { teams: TeamRoundInternetCheck[] }) {
  const itemMatch = useCallback(
    (search: string, item: TeamRoundInternetCheck) =>
      item.teamSlug.toLowerCase().includes(search) ||
      item.teamName.toLowerCase().includes(search) ||
      item.instituteName.toLowerCase().includes(search) ||
      item.instituteCity.toLowerCase().includes(search),
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <Form
        defaultValue={{
          onlyIssues: DEFAULT_ONLY_ISSUES,
          missingThreshold: DEFAULT_MISSING_THRESHOLD,
          failedThreshold: DEFAULT_FAILED_THRESHOLD,
        }}
        onSubmit={() => {}}
        className="!max-w-none !w-full ![align-items:unset] gap-4">
        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
          <NumberField
            field="missingThreshold"
            label="Missing threshold"
            placeholder="Missing threshold"
            min={1}
          />
          <NumberField
            field="failedThreshold"
            label="Failed threshold"
            placeholder="Failed threshold"
            min={1}
          />
          <CheckboxField field="onlyIssues" label="Solo team con controlli falliti" />
        </div>
        {({ onlyIssues, missingThreshold, failedThreshold }) => (
          <Table
            data={teams.filter((team) =>
              showTeam(team, onlyIssues, missingThreshold, failedThreshold),
            )}
            itemMatch={itemMatch}
            header={InternetTableHeaders}
            row={({ item }: { item: TeamRoundInternetCheck }) => (
              <InternetTeamRoundRow
                item={item}
                missingThreshold={missingThreshold ?? DEFAULT_MISSING_THRESHOLD}
                failedThreshold={failedThreshold ?? DEFAULT_FAILED_THRESHOLD}
              />
            )}
            className="grid-cols-[repeat(6,auto)]"
          />
        )}
      </Form>
    </div>
  );
}

function InternetTableHeaders() {
  return (
    <>
      <div>Slug</div>
      <div>Team</div>
      <div>Istituto</div>
      <div>PC</div>
      <div>Check</div>
      <div>Azioni</div>
    </>
  );
}

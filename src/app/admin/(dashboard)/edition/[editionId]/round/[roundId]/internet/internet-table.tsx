"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { CheckboxField, Form, NumberField } from "@olinfo/react-components";
import clsx from "clsx";

import { Table } from "~/components/table";
import type { TeamRoundInternetCheck } from "~/lib/internet-check";

const DEFAULT_ONLY_ISSUES = true;
const DEFAULT_MISSING_THRESHOLD = 5;
const DEFAULT_FAILED_THRESHOLD = 1;

type InternetFilterState = {
  onlyIssues: boolean;
  missingThreshold: number;
  failedThreshold: number;
};

function showTeam(
  item: TeamRoundInternetCheck,
  onlyIssues: boolean = DEFAULT_ONLY_ISSUES,
  missingThreshold: number = DEFAULT_MISSING_THRESHOLD,
  failThreshold: number = DEFAULT_FAILED_THRESHOLD,
) {
  if (!onlyIssues) return true;
  return (
    item.numFailedChecks >= failThreshold ||
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
  const searchParams = useSearchParams();

  const defaultValue = useMemo(
    () => ({
      onlyIssues: parseBooleanFilter(searchParams.get("onlyIssues"), DEFAULT_ONLY_ISSUES),
      missingThreshold: parseNumberFilter(
        searchParams.get("missingThreshold"),
        DEFAULT_MISSING_THRESHOLD,
      ),
      failedThreshold: parseNumberFilter(
        searchParams.get("failedThreshold"),
        DEFAULT_FAILED_THRESHOLD,
      ),
    }),
    [searchParams],
  );

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
        defaultValue={defaultValue}
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
          <CheckboxField field="onlyIssues" label="Solo team sospetti" />
        </div>
        {(filters) => (
          <InternetTableContent
            teams={teams}
            filters={filters}
            itemMatch={itemMatch}
            searchParams={searchParams}
          />
        )}
      </Form>
    </div>
  );
}

function InternetTableContent({
  teams,
  filters,
  itemMatch,
  searchParams,
}: {
  teams: TeamRoundInternetCheck[];
  filters: Partial<InternetFilterState>;
  itemMatch: (search: string, item: TeamRoundInternetCheck) => boolean;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const onlyIssues = filters.onlyIssues ?? DEFAULT_ONLY_ISSUES;
  const missingThreshold = filters.missingThreshold ?? DEFAULT_MISSING_THRESHOLD;
  const failedThreshold = filters.failedThreshold ?? DEFAULT_FAILED_THRESHOLD;

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    setBooleanFilter(nextParams, "onlyIssues", onlyIssues, DEFAULT_ONLY_ISSUES);
    setNumberFilter(
      nextParams,
      "missingThreshold",
      filters.missingThreshold,
      DEFAULT_MISSING_THRESHOLD,
    );
    setNumberFilter(
      nextParams,
      "failedThreshold",
      filters.failedThreshold,
      DEFAULT_FAILED_THRESHOLD,
    );

    const nextQuery = nextParams.toString();
    if (nextQuery === searchParams.toString()) return;

    router.replace((nextQuery ? `${pathname}?${nextQuery}` : pathname) as Route, {
      scroll: false,
    });
  }, [
    filters.failedThreshold,
    filters.missingThreshold,
    onlyIssues,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <Table
      data={teams.filter((team) => showTeam(team, onlyIssues, missingThreshold, failedThreshold))}
      itemMatch={itemMatch}
      header={InternetTableHeaders}
      row={({ item }: { item: TeamRoundInternetCheck }) => (
        <InternetTeamRoundRow
          item={item}
          missingThreshold={missingThreshold}
          failedThreshold={failedThreshold}
        />
      )}
      className="grid-cols-[repeat(6,auto)]"
    />
  );
}

function parseBooleanFilter(value: string | null, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseNumberFilter(value: string | null, fallback: number) {
  if (value == null) return fallback;

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 1 ? parsedValue : fallback;
}

function setBooleanFilter(
  params: URLSearchParams,
  key: string,
  value: boolean,
  defaultValue: boolean,
) {
  if (value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}

function setNumberFilter(
  params: URLSearchParams,
  key: string,
  value: number | undefined,
  defaultValue: number,
) {
  if (value == null || value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}

function InternetTableHeaders() {
  return (
    <>
      <div>Username</div>
      <div>Nome</div>
      <div>Istituto</div>
      <div>PC</div>
      <div>Check</div>
      <div>Azioni</div>
    </>
  );
}

"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ProctoringIssuesToggle({ checked }: { checked: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(value: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("onlyIssues", "1");
    } else {
      params.delete("onlyIssues");
    }

    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }

  return (
    <label className="label cursor-pointer gap-2">
      <span className="label-text">Solo team con irregolarità</span>
      <input
        type="checkbox"
        className="toggle toggle-sm"
        checked={checked}
        onChange={(event) => toggle(event.currentTarget.checked)}
      />
    </label>
  );
}

"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Table } from "~/components/table";
import type { EditionAdminItem } from "~/lib/edition";

export function AdminEditionsTable({ editions }: { editions: EditionAdminItem[] }) {
  const itemMatch = useCallback(
    (search: string, edition: EditionAdminItem) =>
      edition.name.toLowerCase().includes(search) || edition.year.toLowerCase().includes(search),
    [],
  );

  return (
    <Table
      data={editions}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(2,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Nome</div>
      <div>Anno</div>
    </>
  );
}

function TableRow({ item: edition }: { item: EditionAdminItem }) {
  return (
    <>
      <div>
        <Link href={`/admin/edition/${edition.id}`} className="link link-primary">
          {edition.name}
        </Link>
      </div>
      <div>{edition.year}</div>
    </>
  );
}

"use client";

import { useMemo, useRef } from "react";

import {
  Button,
  DateTimeField,
  Form,
  FormButton,
  Modal,
  SingleFileField,
  SubmitButton,
  TextField,
} from "@olinfo/react-components";
import {
  getMonth,
  getYear,
  nextFriday,
  nextMonday,
  nextThursday,
  nextTuesday,
  nextWednesday,
} from "date-fns";
import { maxBy } from "lodash";

import type { EditionAdminItem } from "~/lib/edition";
import type { EditionData } from "~/lib/new-edition";

import { createEdition } from "./actions";

function ordinalSuffix(n: number): string {
  const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
  const suffixes = {
    zero: "th",
    one: "st",
    two: "nd",
    few: "rd",
    many: "th",
    other: "th",
  };
  const rule = pr.select(n);
  return suffixes[rule];
}

function getDefaultData(editions: EditionAdminItem[]) {
  const today = new Date();
  const editionYear = getYear(today) + (getMonth(today) < 11 ? 0 : 1);

  const newId =
    maxBy(
      editions.map((e) => {
        const id = Number(e.id);
        return Number.isNaN(id) ? 0 : id + 1;
      }),
    ) ?? 0;

  return {
    id: String(newId),
    year: `${editionYear}/${(editionYear + 1) % 100}`,
    title: `${newId}${ordinalSuffix(newId)} Edition`,
    round1Date: nextMonday(new Date(editionYear, 10, 7, 14, 30)),
    round2Date: nextTuesday(new Date(editionYear, 11, 7, 14, 30)),
    round3Date: nextWednesday(new Date(editionYear + 1, 0, 14, 14, 30)),
    round4Date: nextThursday(new Date(editionYear + 1, 1, 14, 14, 30)),
    roundFinalDate: nextFriday(new Date(editionYear + 1, 2, 7, 12, 0)),
  };
}

export function NewEditionButton({ editions }: { editions: EditionAdminItem[] }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const defaultValue = useMemo(() => getDefaultData(editions), [editions]);

  async function handleSubmit({ csvFile, ...data }: EditionData & { csvFile: File }) {
    const files = new FormData();
    files.append("teams", csvFile);

    await createEdition(files, data);
    modalRef.current?.close();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        Crea nuova edizione
      </Button>
      <Modal ref={modalRef} title="Crea nuova edizione">
        <Form defaultValue={defaultValue} onSubmit={handleSubmit}>
          <TextField field="id" label="ID edizione" placeholder="" />
          <TextField field="year" label="Anno edizione" placeholder="" />
          <TextField field="title" label="Titolo edizione" placeholder="" />
          <SingleFileField field="csvFile" label="CSV partecipanti" accept=".csv" />
          <DateTimeField field="round1Date" label="Round 1" placeholder="" />
          <DateTimeField field="round2Date" label="Round 2" placeholder="" />
          <DateTimeField field="round3Date" label="Round 3" placeholder="" />
          <DateTimeField field="round4Date" label="Round 4" placeholder="" />
          <DateTimeField field="roundFinalDate" label="Round finale" placeholder="" />
          <div className="flex w-full flex-wrap justify-center gap-2">
            <FormButton onClick={() => modalRef.current?.close()}>Annulla</FormButton>
            <SubmitButton>Crea</SubmitButton>
          </div>
        </Form>
      </Modal>
    </>
  );
}

"use client";

import { useRef } from "react";

import {
  Button,
  DateTimeField,
  Form,
  FormButton,
  Modal,
  SingleFileField,
  SubmitButton,
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

type EditionFormState = {
  csvFile: File;
  round1Date: Date;
  round2Date: Date;
  round3Date: Date;
  round4Date: Date;
  roundFinalDate: Date;
};

function getDefaultDates() {
  const today = new Date();
  const editionYear = getYear(today) + (getMonth(today) < 11 ? 0 : 1);

  return {
    round1Date: nextMonday(new Date(editionYear, 10, 7, 14, 30)),
    round2Date: nextTuesday(new Date(editionYear, 11, 7, 14, 30)),
    round3Date: nextWednesday(new Date(editionYear, 0, 14, 14, 30)),
    round4Date: nextThursday(new Date(editionYear, 1, 14, 14, 30)),
    roundFinalDate: nextFriday(new Date(editionYear, 2, 7, 12, 0)),
  };
}

export function NewEditionButton() {
  const modalRef = useRef<HTMLDialogElement>(null);

  function handleSubmit(value: EditionFormState) {
    // TODO: implement actual submission logic
    console.log("Form submitted:", value);
    modalRef.current?.close();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        Crea nuova edizione
      </Button>
      <Modal ref={modalRef} title="Crea nuova edizione">
        <Form defaultValue={getDefaultDates()} onSubmit={handleSubmit}>
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

"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import {
  Button,
  CheckboxField,
  Form,
  FormButton,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@olinfo/react-components";
import clsx from "clsx";

import { Modal } from "~/components/modal";
import type { PenalizationLevel } from "~/lib/db/schema";

import { createRoundProctoringPenalization, updateRoundPenalization } from "./actions";

const levelOptions: Record<PenalizationLevel, string> = {
  yellow: "Giallo",
  red: "Rosso",
};

type PenalizationFormValues = {
  level: PenalizationLevel;
  appealAllowed: boolean;
  description: string;
};

type EditPenalization = {
  id: number;
  level: PenalizationLevel;
  appealAllowed: boolean;
  description: string;
};

type Props = {
  editionId: string;
  roundId: string;
  /** Squadra da penalizzare; richiesto in creazione. */
  teamSlug?: string;
  /** Penalizzazione da modificare; se presente il modale è in modifica. */
  penalization?: EditPenalization;
  label?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export function PenalizationModalButton({
  editionId,
  roundId,
  teamSlug,
  penalization,
  label,
  className = "btn-primary btn-xs",
  disabled,
  title,
}: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const isEdit = penalization !== undefined;

  async function handleSubmit(values: PenalizationFormValues) {
    const payload = {
      level: values.level,
      appealAllowed: values.level === "yellow" && values.appealAllowed,
      description: values.description,
    };

    if (penalization) {
      await updateRoundPenalization(editionId, roundId, penalization.id, payload);
    } else {
      if (!teamSlug) throw new Error("Squadra non specificata.");
      await createRoundProctoringPenalization(editionId, roundId, teamSlug, payload);
    }

    modalRef.current?.close();
    router.refresh();
  }

  return (
    <>
      <span title={title} className="inline-flex">
        <Button
          className={clsx(className)}
          onClick={() => modalRef.current?.showModal()}
          disabled={disabled}>
          {label ?? (isEdit ? "Modifica" : "Penalizza")}
        </Button>
      </span>
      <Modal
        ref={modalRef}
        title={isEdit ? "Modifica penalizzazione" : `Penalizza${teamSlug ? ` ${teamSlug}` : ""}`}>
        {!isEdit && (
          <p className="mb-2">
            Crea una penalizzazione di proctoring per la squadra <strong>{teamSlug}</strong>.
          </p>
        )}
        <Form
          defaultValue={{
            level: penalization?.level ?? "yellow",
            appealAllowed: penalization?.appealAllowed ?? true,
            description: penalization?.description ?? "",
          }}
          onSubmit={handleSubmit}
          className="!max-w-none">
          {(state) => (
            <>
              <SelectField field="level" label="Livello" options={levelOptions} />
              {state.level === "red" ? (
                <p className="mb-1 text-sm opacity-70">
                  Le penalizzazioni di livello rosso non sono appellabili.
                </p>
              ) : (
                <CheckboxField field="appealAllowed" label="Appellabile" optional />
              )}
              <TextAreaField
                field="description"
                label="Descrizione"
                rows={4}
                validate={(value) => (value.trim() ? undefined : "Inserisci una descrizione.")}
              />
              <div className="flex justify-end gap-2">
                <FormButton className="btn-info" onClick={() => modalRef.current?.close()}>
                  Annulla
                </FormButton>
                <SubmitButton className="btn-success">
                  {isEdit ? "Salva" : "Penalizza"}
                </SubmitButton>
              </div>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}

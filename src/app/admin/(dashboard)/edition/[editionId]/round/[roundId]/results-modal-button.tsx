"use client";

import { startTransition, useRef, useState, ViewTransition } from "react";

import { Button, Form, SingleFileField, SubmitButton } from "@olinfo/react-components";
import clsx from "clsx";
import { CircleCheck, CircleX, Upload } from "lucide-react";

import { Modal } from "~/components/modal";
import type { UploadResultStep } from "~/lib/result";
import type { RoundAdminItem } from "~/lib/round";

import { uploadRoundResults } from "./actions";

const stepMessages = [
  "Caricamento archivio",
  "Estrazione archivio",
  "Lettura ranking",
  "Lettura submission",
  "Lettura log CMS",
  "Lettura log proctoring",
  "Salvataggio ranking",
  "Salvataggio submission",
  "Salvataggio partecipazione",
  "Salvataggio proctoring",
  "Pubblicazione round",
] as const;

type UploadStatus = {
  currentStep?: number;
  previousStep?: number;
  error?: string;
  warnings?: string[];
  done?: boolean;
};

export function ResultsModalButton({ round }: { round: RoundAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});

  async function handleUpload({ file }: { file: File }) {
    setUploadStatus({ currentStep: 0 });

    const formData = new FormData();
    formData.append("file", file);

    const stream = (await uploadRoundResults(
      round.editionId,
      round.slug,
      formData,
    )) as unknown as AsyncIterable<{
      step: UploadResultStep;
      error?: string;
      warnings?: string[];
    }>;
    let hasWarnings = false;
    for await (const { step, error, warnings } of stream) {
      hasWarnings = hasWarnings || Boolean(warnings?.length);
      startTransition(() => {
        setUploadStatus((prev) => ({
          previousStep: step === prev.currentStep ? prev.previousStep : prev.currentStep,
          currentStep: step,
          error: error,
          warnings: warnings ?? prev.warnings,
        }));
      });
      if (error) return;
    }

    // Se qualche submission è stata ignorata lasciamo il modale aperto con
    // l'elenco: sparire in silenzio dal database sarebbe peggio.
    if (hasWarnings) {
      startTransition(() => {
        setUploadStatus((prev) => ({ ...prev, done: true }));
      });
      return;
    }

    modalRef.current?.close();
  }

  return (
    <>
      <Button
        onClick={() => {
          setUploadStatus({});
          modalRef.current?.showModal();
        }}
        className="btn-primary">
        <Upload className="size-5" />
        Carica risultati
      </Button>
      <Modal ref={modalRef} title="Carica risultati">
        <Form key={round.slug} onSubmit={handleUpload} className="!max-w-none">
          <SingleFileField field="file" label="round.tar.gz" accept=".gz,.tgz" />

          {uploadStatus.currentStep == null ? (
            <div className="flex flex-wrap justify-end gap-2">
              <SubmitButton className="btn-success">Carica</SubmitButton>
            </div>
          ) : (
            <div className="w-full px-4 pt-4">
              <Step key={uploadStatus.previousStep} step={uploadStatus.previousStep} previous />
              <Step
                key={uploadStatus.currentStep}
                step={uploadStatus.currentStep}
                error={uploadStatus.error}
                done={uploadStatus.done}
              />
              {uploadStatus.error ? (
                <p className="text-sm text-error">{uploadStatus.error}</p>
              ) : (
                <div className="h-5" />
              )}
            </div>
          )}

          {uploadStatus.warnings?.length ? (
            <div className="w-full px-4 pb-4">
              <p className="text-sm font-medium text-warning">
                {uploadStatus.warnings.length === 1
                  ? "Una submission è stata ignorata:"
                  : `${uploadStatus.warnings.length} submission sono state ignorate:`}
              </p>
              <ul className="mt-1 text-sm list-disc list-inside text-base-content/80">
                {uploadStatus.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setUploadStatus({});
                    modalRef.current?.close();
                  }}
                  className="btn-primary">
                  Chiudi
                </Button>
              </div>
            </div>
          ) : null}
        </Form>
      </Modal>
    </>
  );
}

function Step({
  step,
  error,
  previous,
  done,
}: {
  step?: number;
  error?: string;
  previous?: boolean;
  done?: boolean;
}) {
  if (step == null) {
    return <div className="h-4 mb-2" />;
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-2 mb-2",
        previous ? "text-xs text-base-content/70" : "text-sm font-medium",
      )}>
      {error ? (
        <CircleX className="size-5 text-error" />
      ) : previous ? (
        <CircleCheck className="size-4 text-success" />
      ) : done ? (
        <CircleCheck className="size-5 text-success" />
      ) : (
        <span className="loading loading-spinner loading-sm" />
      )}
      <ViewTransition>
        <span>{stepMessages[step]}</span>
      </ViewTransition>
    </div>
  );
}

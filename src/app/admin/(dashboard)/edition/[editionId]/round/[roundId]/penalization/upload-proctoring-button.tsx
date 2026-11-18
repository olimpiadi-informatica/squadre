"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import {
  Button,
  Form,
  FormButton,
  MultipleFileField,
  SubmitButton,
} from "@olinfo/react-components";
import { Upload } from "lucide-react";

import { Modal } from "~/components/modal";

import { uploadRoundProctoringPenalization } from "./actions";

export function UploadProctoringButton({
  editionId,
  roundId,
}: {
  editionId: string;
  roundId: string;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  async function handleUpload({ files }: { files: Record<string, File> }) {
    const formData = new FormData();
    for (const file of Object.values(files)) {
      formData.append("files", file);
    }

    await uploadRoundProctoringPenalization(editionId, roundId, formData);
    modalRef.current?.close();
    router.refresh();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        <Upload className="size-5" />
        Carica proctoring
      </Button>

      <Modal ref={modalRef} title="Carica penalizzazioni proctoring">
        <p>
          Il CSV deve contenere una squadra e le motivazioni per ogni riga (es.{" "}
          <code>Token,Reasons</code>). Le penalità vengono create a livello giallo.
        </p>

        <Form key={`${editionId}-${roundId}`} onSubmit={handleUpload} className="!max-w-none mt-2">
          <MultipleFileField field="files" label="File CSV" accept=".csv,text/csv,text/plain" />

          <div className="flex justify-end gap-2">
            <FormButton className="btn-info" onClick={() => modalRef.current?.close()}>
              Annulla
            </FormButton>
            <SubmitButton className="btn-success">Carica</SubmitButton>
          </div>
        </Form>
      </Modal>
    </>
  );
}

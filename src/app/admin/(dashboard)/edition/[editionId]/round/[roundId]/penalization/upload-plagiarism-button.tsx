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

import { uploadRoundPlagiarismPenalization } from "./actions";

export function UploadPlagiarismButton({
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

    await uploadRoundPlagiarismPenalization(editionId, roundId, formData);
    modalRef.current?.close();
    router.refresh();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        <Upload className="size-5" />
        Carica copiature
      </Button>

      <Modal ref={modalRef} title="Carica copiature">
        <p>I file devono contenere due path e una descrizione separati da tab per ogni riga.</p>

        <Form key={`${editionId}-${roundId}`} onSubmit={handleUpload} className="!max-w-none mt-2">
          <MultipleFileField
            field="files"
            label="File TSV"
            accept=".tsv,text/tab-separated-values,text/plain"
          />

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

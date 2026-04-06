"use client";

import { useRef } from "react";

import { Button, Form, FormButton, SingleFileField, SubmitButton } from "@olinfo/react-components";
import { Upload } from "lucide-react";

import { Modal } from "~/components/modal";
import type { RoundAdminItem } from "~/lib/round";

import { uploadRoundResults } from "./actions";

export function UploadModalButton({ round }: { round: RoundAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function handleUpload({ file }: { file: File }) {
    const formData = new FormData();
    formData.append("file", file);
    await uploadRoundResults(round.editionId, round.slug, formData);
    modalRef.current?.close();
  }

  return (
    <>
      <Button onClick={() => modalRef.current?.showModal()} className="btn-primary">
        <Upload className="size-5" />
        Carica risultati
      </Button>
      <Modal ref={modalRef} title="Carica risultati">
        <p>Carica i risultati del {round.title}</p>

        <Form key={round.slug} onSubmit={handleUpload} className="max-w-none">
          <SingleFileField field="file" label="round.tar.gz" accept=".gz,.tgz" />
          <div className="flex flex-wrap justify-end gap-2">
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

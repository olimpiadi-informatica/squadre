"use client";

import { useRef } from "react";

import { Button, Form, SubmitButton, TextAreaField } from "@olinfo/react-components";

import { Modal } from "~/components/modal";

import { savePasswordEmailTemplate } from "./actions";

type Props = {
  editionId: string;
  roundId: string;
  content: string;
};

export function PasswordTemplateModal({ editionId, roundId, content }: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function handleSubmit({ content }: { content: string }) {
    await savePasswordEmailTemplate(editionId, roundId, content);
    modalRef.current?.close();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        Modifica template
      </Button>
      <Modal ref={modalRef} title="Template avvisi password">
        <Form
          key={`${editionId}-${roundId}`}
          defaultValue={{ content }}
          onSubmit={handleSubmit}
          className="!max-w-none">
          <TextAreaField field="content" label="Contenuto email" placeholder="" rows={8} />
          <div className="flex w-full justify-center gap-2">
            <SubmitButton>Salva template</SubmitButton>
          </div>
        </Form>
      </Modal>
    </>
  );
}

"use client";

import { useRef } from "react";

import { Button, Form, SubmitButton, TextAreaField } from "@olinfo/react-components";

import { Modal } from "~/components/modal";

type Props = {
  label: string;
  content: string;
  onSave: (content: string) => Promise<void>;
};

export function TemplateModal({ label, content, onSave }: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function handleSubmit({ content }: { content: string }) {
    await onSave(content);
    modalRef.current?.close();
  }

  return (
    <>
      <Button className="btn-primary" onClick={() => modalRef.current?.showModal()}>
        Modifica template
      </Button>
      <Modal ref={modalRef} title={label}>
        <Form defaultValue={{ content }} onSubmit={handleSubmit} className="!max-w-none">
          <TextAreaField field="content" label="Contenuto email" placeholder="" rows={8} />
          <div className="flex w-full justify-center gap-2">
            <SubmitButton>Salva template</SubmitButton>
          </div>
        </Form>
      </Modal>
    </>
  );
}

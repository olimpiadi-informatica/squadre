"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import { Button, Form, FormButton, Modal, SubmitButton, TextField } from "@olinfo/react-components";

import { Table } from "~/components/table";
import type { EditionAdminItem } from "~/lib/edition";

import { deleteEditionAction, toggleEditionVisibility } from "./actions";

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
      className="grid-cols-[repeat(3,auto)]"
    />
  );
}

function TableHeaders() {
  return (
    <>
      <div>Nome</div>
      <div>Anno</div>
      <div>Azioni</div>
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
      <div className="flex flex-wrap justify-center gap-2">
        {edition.public ? (
          <MakePrivateModalButton edition={edition} />
        ) : (
          <MakePublicModalButton edition={edition} />
        )}
        <DeleteModalButton edition={edition} />
      </div>
    </>
  );
}

function MakePublicModalButton({ edition }: { edition: EditionAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function confirmMakePublic() {
    await toggleEditionVisibility(edition.id, edition.public);
    modalRef.current?.close();
  }

  return (
    <>
      <Button onClick={() => modalRef.current?.showModal()} className="btn-error btn-sm">
        Rendi pubblico
      </Button>
      {createPortal(
        <Modal ref={modalRef} title="Rendi pubblica l'edizione?">
          <p>{`L'edizione "${edition.name}" sarà visibile al pubblico.`}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button className="btn-info" onClick={() => modalRef.current?.close()}>
              Annulla
            </Button>
            <Button onClick={confirmMakePublic} className="btn-warning">
              Conferma
            </Button>
          </div>
        </Modal>,
        document.body,
      )}
    </>
  );
}

function MakePrivateModalButton({ edition }: { edition: EditionAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function confirmMakePrivate() {
    await toggleEditionVisibility(edition.id, edition.public);
    modalRef.current?.close();
  }

  return (
    <>
      <Button onClick={() => modalRef.current?.showModal()} className="btn-warning btn-sm">
        Rendi privato
      </Button>
      {createPortal(
        <Modal ref={modalRef} title="Rendi privata l'edizione?">
          <p>{`L'edizione "${edition.name}" sarà nascosta al pubblico.`}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button className="btn-info" onClick={() => modalRef.current?.close()}>
              Annulla
            </Button>
            <Button onClick={confirmMakePrivate} className="btn-warning">
              Conferma
            </Button>
          </div>
        </Modal>,
        document.body,
      )}
    </>
  );
}

function DeleteModalButton({ edition }: { edition: EditionAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function confirmDelete({ deleteConfirmation }: { deleteConfirmation: string }) {
    if (deleteConfirmation === "Elimina") {
      await deleteEditionAction(edition.id);
      modalRef.current?.close();
    }
  }

  return (
    <>
      <Button onClick={() => modalRef.current?.showModal()} className="btn-error btn-sm">
        Elimina
      </Button>
      {createPortal(
        <Modal ref={modalRef} title="Elimina edizione">
          <Form key={edition.id} onSubmit={confirmDelete}>
            <p>
              Sei sicuro di voler eliminare l'edizione "{edition.name}"? L'operazione è
              irreversibile.
            </p>
            <TextField
              field="deleteConfirmation"
              label="Digita Elimina per confermare:"
              placeholder="Digita 'Elimina'"
            />
            {({ deleteConfirmation }) => (
              <div className="flex flex-wrap justify-center gap-2">
                <FormButton className="btn btn-info" onClick={() => modalRef.current?.close()}>
                  Annulla
                </FormButton>
                <SubmitButton className="btn-error" disabled={deleteConfirmation !== "Elimina"}>
                  Elimina
                </SubmitButton>
              </div>
            )}
          </Form>
        </Modal>,
        document.body,
      )}
    </>
  );
}

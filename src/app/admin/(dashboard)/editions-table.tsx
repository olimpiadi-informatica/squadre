"use client";

import Link from "next/link";
import { type RefObject, useCallback, useRef, useState } from "react";

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

  const makePublicModalRef = useRef<HTMLDialogElement>(null);
  const makePrivateModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  const [selectedEdition, setSelectedEdition] = useState<EditionAdminItem | null>(null);

  async function confirmMakePublic() {
    await toggleEditionVisibility(selectedEdition!.id, selectedEdition!.public);
    makePublicModalRef.current?.close();
  }

  async function confirmMakePrivate() {
    await toggleEditionVisibility(selectedEdition!.id, selectedEdition!.public);
    makePrivateModalRef.current?.close();
  }

  async function confirmDelete({ deleteConfirmation }: { deleteConfirmation: string }) {
    if (deleteConfirmation === "Elimina") {
      await deleteEditionAction(selectedEdition!.id);
      deleteModalRef.current?.close();
    }
  }

  return (
    <>
      <Table
        data={editions}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={(props) => (
          <TableRow
            {...props}
            setSelectedEdition={setSelectedEdition}
            makePrivateModalRef={makePrivateModalRef}
            makePublicModalRef={makePublicModalRef}
            deleteModalRef={deleteModalRef}
          />
        )}
        className="grid-cols-[repeat(3,auto)]"
      />
      <Modal ref={makePublicModalRef} title="Rendi pubblica l'edizione?">
        <p>{`L'edizione "${selectedEdition?.name}" sarà visibile al pubblico.`}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button className="btn-info" onClick={() => makePublicModalRef.current?.close()}>
            Annulla
          </Button>
          <Button onClick={confirmMakePublic} className="btn-warning">
            Conferma
          </Button>
        </div>
      </Modal>
      <Modal ref={makePrivateModalRef} title="Rendi privata l'edizione?">
        <p>{`L'edizione "${selectedEdition?.name}" sarà nascosta al pubblico.`}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button className="btn-info" onClick={() => makePrivateModalRef.current?.close()}>
            Annulla
          </Button>
          <Button onClick={confirmMakePrivate} className="btn-warning">
            Conferma
          </Button>
        </div>
      </Modal>
      <Modal ref={deleteModalRef} title="Elimina edizione">
        <Form key={selectedEdition?.id} onSubmit={confirmDelete}>
          <p>
            Sei sicuro di voler eliminare l'edizione "{selectedEdition?.name}"? L'operazione è
            irreversibile.
          </p>
          <TextField
            field="deleteConfirmation"
            label="Digita Elimina per confermare:"
            placeholder="Digita 'Elimina'"
          />
          {({ deleteConfirmation }) => (
            <div className="flex flex-wrap justify-center gap-2">
              <FormButton className="btn btn-info" onClick={() => deleteModalRef.current?.close()}>
                Annulla
              </FormButton>
              <SubmitButton className="btn-error" disabled={deleteConfirmation !== "Elimina"}>
                Elimina
              </SubmitButton>
            </div>
          )}
        </Form>
      </Modal>
    </>
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

function TableRow({
  item: edition,
  setSelectedEdition,
  makePrivateModalRef,
  makePublicModalRef,
  deleteModalRef,
}: {
  item: EditionAdminItem;
  setSelectedEdition: (edition: EditionAdminItem) => void;
  makePrivateModalRef: RefObject<HTMLDialogElement | null>;
  makePublicModalRef: RefObject<HTMLDialogElement | null>;
  deleteModalRef: RefObject<HTMLDialogElement | null>;
}) {
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
          <Button
            onClick={() => {
              setSelectedEdition(edition);
              makePrivateModalRef.current?.showModal();
            }}
            className="btn-warning btn-sm">
            Rendi privato
          </Button>
        ) : (
          <Button
            onClick={() => {
              setSelectedEdition(edition);
              makePublicModalRef.current?.showModal();
            }}
            className="btn-error btn-sm">
            Rendi pubblico
          </Button>
        )}
        <Button
          onClick={() => {
            setSelectedEdition(edition);
            deleteModalRef.current?.showModal();
          }}
          className="btn-error btn-sm">
          Elimina
        </Button>
      </div>
    </>
  );
}

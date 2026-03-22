"use client";

import Link from "next/link";
import { type RefObject, useCallback, useRef, useState } from "react";

import { Button, Modal } from "@olinfo/react-components";

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

  async function confirmDelete() {
    await deleteEditionAction(selectedEdition!.id);
    deleteModalRef.current?.close();
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
          <button
            className="btn btn-info"
            onClick={() => makePublicModalRef.current?.close()}
            type="button">
            Annulla
          </button>
          <Button onClick={confirmMakePublic} className="btn-warning">
            Conferma
          </Button>
        </div>
      </Modal>
      <Modal ref={makePrivateModalRef} title="Rendi privata l'edizione?">
        <p>{`L'edizione "${selectedEdition?.name}" sarà nascosta al pubblico.`}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            className="btn btn-info"
            onClick={() => makePrivateModalRef.current?.close()}
            type="button">
            Annulla
          </button>
          <Button onClick={confirmMakePrivate} className="btn-warning">
            Conferma
          </Button>
        </div>
      </Modal>
      <Modal ref={deleteModalRef} title="Elimina edizione">
        <p>{`Sei sicuro di voler eliminare l'edizione "${selectedEdition?.name}"? L'operazione è irreversibile.`}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            className="btn btn-info"
            onClick={() => deleteModalRef.current?.close()}
            type="button">
            Annulla
          </button>
          <Button onClick={confirmDelete} className="btn-error">
            Elimina
          </Button>
        </div>
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
        <Link href={`/admin/edition/${edition.id}` as any} className="link link-primary">
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

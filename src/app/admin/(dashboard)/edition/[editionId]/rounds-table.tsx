"use client";

import { type RefObject, useRef, useState } from "react";

import { Button, Modal } from "@olinfo/react-components";
import { intlFormat } from "date-fns";

import { Table } from "~/components/table";
import type { RoundAdminItem } from "~/lib/round";

import { getRoundCredentials, toggleRoundVisibility } from "./actions";

export function AdminRoundsTable({ rounds }: { rounds: RoundAdminItem[] }) {
  const makePublicModalRef = useRef<HTMLDialogElement>(null);
  const makePrivateModalRef = useRef<HTMLDialogElement>(null);

  const [selectedRound, setSelectedRound] = useState<RoundAdminItem | null>(null);

  async function confirmMakePublic() {
    await toggleRoundVisibility(selectedRound!.editionId, selectedRound!.id, selectedRound!.public);
    makePublicModalRef.current?.close();
  }

  async function confirmMakePrivate() {
    await toggleRoundVisibility(selectedRound!.editionId, selectedRound!.id, selectedRound!.public);
    makePrivateModalRef.current?.close();
  }

  return (
    <>
      <Table
        data={rounds}
        header={TableHeaders}
        row={(props) => (
          <TableRow
            {...props}
            setSelectedRound={setSelectedRound}
            makePrivateModalRef={makePrivateModalRef}
            makePublicModalRef={makePublicModalRef}
          />
        )}
        className="grid-cols-[repeat(3,auto)]"
      />
      <Modal ref={makePublicModalRef} title="Rendi pubblico il round?">
        <p>{`Il round "${selectedRound?.title}" sarà visibile al pubblico.`}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
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
      <Modal ref={makePrivateModalRef} title="Rendi privato il round?">
        <p>{`Il round "${selectedRound?.title}" sarà nascosto al pubblico.`}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
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
    </>
  );
}

function TableHeaders() {
  return (
    <>
      <div>Titolo</div>
      <div>Data</div>
      <div>Azioni</div>
    </>
  );
}

function TableRow({
  item: round,
  setSelectedRound,
  makePrivateModalRef,
  makePublicModalRef,
}: {
  item: RoundAdminItem;
  setSelectedRound: (round: RoundAdminItem) => void;
  makePrivateModalRef: RefObject<HTMLDialogElement | null>;
  makePublicModalRef: RefObject<HTMLDialogElement | null>;
}) {
  const isPublic = round.public === 1;

  return (
    <>
      <div>{round.title}</div>
      <div>
        {intlFormat(
          round.startsAt,
          { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" },
          { locale: "it-IT" },
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={downloadCredentials} className="btn-info btn-sm">
          Scarica contest.yaml
        </Button>
        {isPublic ? (
          <Button
            onClick={() => {
              setSelectedRound(round);
              makePrivateModalRef.current?.showModal();
            }}
            className="btn-warning btn-sm">
            Rendi privato
          </Button>
        ) : (
          <Button
            onClick={() => {
              setSelectedRound(round);
              makePublicModalRef.current?.showModal();
            }}
            className="btn-error btn-sm">
            Rendi pubblico
          </Button>
        )}
      </div>
    </>
  );

  async function downloadCredentials() {
    if (!window.showSaveFilePicker) {
      throw new Error("Browser non supportato, usa Chrome o Edge");
    }

    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "regular.yaml",
        types: [{ description: "File YAML", accept: { "text/yaml": [".yaml"] } }],
      });
    } catch {
      return;
    }

    const yaml = await getRoundCredentials(round.editionId, round.id);
    const writable = await fileHandle.createWritable();
    await writable.write(yaml);
    await writable.close();
  }
}

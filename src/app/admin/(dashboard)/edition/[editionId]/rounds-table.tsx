"use client";

import { type RefObject, useCallback, useRef, useState } from "react";

import { Button, Modal } from "@olinfo/react-components";
import { intlFormat } from "date-fns";
import { saveAs } from "file-saver";

import { Table } from "~/components/table";
import type { RoundAdminItem } from "~/lib/round";

import { getFogliettiPdf, getRoundCredentials, toggleRoundVisibility } from "./actions";

export function AdminRoundsTable({ rounds }: { rounds: RoundAdminItem[] }) {
  const itemMatch = useCallback(
    (search: string, round: RoundAdminItem) => round.title.toLowerCase().includes(search),
    [],
  );

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
        itemMatch={itemMatch}
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
        <Button onClick={() => downloadCredentials(false)} className="btn-info btn-sm">
          Scarica regular.yaml
        </Button>
        {round.id !== "final" && (
          <Button onClick={() => downloadCredentials(true)} className="btn-info btn-sm">
            Scarica debutant.yaml
          </Button>
        )}
        {round.id === "final" && (
          <Button onClick={downloadFoglietti} className="btn-success btn-sm">
            Scarica foglietti PDF
          </Button>
        )}
        {round.public ? (
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

  async function downloadFoglietti() {
    const pdfBytes = await getFogliettiPdf(round.editionId, round.id);
    saveAs(
      new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }),
      "foglietti.pdf",
    );
  }

  async function downloadCredentials(junior: boolean) {
    const yaml = await getRoundCredentials(round.editionId, round.id, junior);
    saveAs(new Blob([yaml], { type: "text/yaml" }), junior ? "debutant.yaml" : "regular.yaml");
  }
}

"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import {
  Button,
  Form,
  FormButton,
  Modal,
  SingleFileField,
  SubmitButton,
} from "@olinfo/react-components";
import { intlFormat } from "date-fns";
import { saveAs } from "file-saver";

import { Table } from "~/components/table";
import type { RoundAdminItem } from "~/lib/round";

import { getFogliettiPdf, getRoundCredentials, uploadRoundResults } from "./actions";

export function AdminRoundsTable({ rounds }: { rounds: RoundAdminItem[] }) {
  const itemMatch = useCallback(
    (search: string, round: RoundAdminItem) => round.title.toLowerCase().includes(search),
    [],
  );

  const uploadModalRef = useRef<HTMLDialogElement>(null);

  const [selectedRound, setSelectedRound] = useState<RoundAdminItem | null>(null);

  function openUploadModal(round: RoundAdminItem) {
    setSelectedRound(round);
    uploadModalRef.current?.showModal();
  }

  async function handleUpload({ file }: { file: File }) {
    if (!selectedRound) return;
    const formData = new FormData();
    formData.append("file", file);
    await uploadRoundResults(selectedRound.editionId, selectedRound.slug, formData);
    uploadModalRef.current?.close();
  }

  return (
    <>
      <Table
        data={rounds}
        itemMatch={itemMatch}
        header={TableHeaders}
        row={(props) => <TableRow {...props} openUploadModal={openUploadModal} />}
        className="grid-cols-[repeat(4,auto)]"
      />
      <Modal ref={uploadModalRef} title="Carica risultati">
        <p>Carica i risultati del {selectedRound?.title}</p>
        <Form key={selectedRound?.slug} onSubmit={handleUpload} className="max-w-none">
          <SingleFileField field="file" label="round.tar.gz" accept=".gz,.tgz" />
          <div className="flex flex-wrap justify-end gap-2">
            <FormButton className="btn-info" onClick={() => uploadModalRef.current?.close()}>
              Annulla
            </FormButton>
            <SubmitButton className="btn-success">Carica</SubmitButton>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function TableHeaders() {
  return (
    <>
      <div>Titolo</div>
      <div>Data</div>
      <div>Email</div>
      <div>Azioni</div>
    </>
  );
}

function TableRow({
  item: round,
  openUploadModal,
}: {
  item: RoundAdminItem;
  openUploadModal: (round: RoundAdminItem) => void;
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
      <div>
        {round.slug !== "final" && (
          <Link
            href={`/admin/edition/${round.editionId}/${round.slug}/email`}
            className="link link-info">
            Gestisci email password
          </Link>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => downloadCredentials(false)} className="btn-info btn-sm">
          Scarica regular.yaml
        </Button>
        {round.slug !== "final" && (
          <Button onClick={() => downloadCredentials(true)} className="btn-info btn-sm">
            Scarica debutant.yaml
          </Button>
        )}
        {round.slug === "final" && (
          <Button onClick={downloadFoglietti} className="btn-success btn-sm">
            Scarica foglietti PDF
          </Button>
        )}
        <Button onClick={() => openUploadModal(round)} className="btn-warning btn-sm">
          Carica risultati
        </Button>
      </div>
    </>
  );

  async function downloadFoglietti() {
    const pdfBytes = await getFogliettiPdf(round.editionId, round.slug);
    saveAs(
      new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }),
      "foglietti.pdf",
    );
  }

  async function downloadCredentials(junior: boolean) {
    const yaml = await getRoundCredentials(round.editionId, round.slug, junior);
    saveAs(new Blob([yaml], { type: "text/yaml" }), junior ? "debutant.yaml" : "regular.yaml");
  }
}

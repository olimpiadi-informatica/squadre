"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
import YAML from "yaml";

import { Table } from "~/components/table";
import type { RoundAdminItem } from "~/lib/round";

import { getFogliettiPdf, getRoundCredentials, uploadRoundResults } from "./actions";

type TaskItem = { slug: string; title: string };

export function AdminRoundsTable({ rounds }: { rounds: RoundAdminItem[] }) {
  const itemMatch = useCallback(
    (search: string, round: RoundAdminItem) => round.title.toLowerCase().includes(search),
    [],
  );

  return (
    <Table
      data={rounds}
      itemMatch={itemMatch}
      header={TableHeaders}
      row={TableRow}
      className="grid-cols-[repeat(4,auto)]"
    />
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

function TableRow({ item: round }: { item: RoundAdminItem }) {
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
        <TaskModalButton round={round} />
        <UploadModalButton round={round} />
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

function TaskModalButton({ round }: { round: RoundAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [supportsDirectoryPicker, setSupportsDirectoryPicker] = useState<boolean | null>(null);
  useEffect(() => {
    setSupportsDirectoryPicker("showDirectoryPicker" in window);
  }, []);

  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [taskListError, setTaskListError] = useState<string | null>(null);

  function openModal() {
    setTaskList([]);
    setTaskListError(null);
    modalRef.current?.showModal();
  }

  async function handleLoadTaskList() {
    setTaskListError(null);
    setTaskList([]);

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setTaskListError("Errore nell'apertura della directory.");
      return;
    }

    let hasContestFile = false;
    for await (const name of dirHandle.keys()) {
      if (/^(contest|regular)\.ya?ml$/.test(name)) {
        hasContestFile = true;
        break;
      }
    }
    if (!hasContestFile) {
      setTaskListError("La directory non contiene contest.yaml o regular.yaml.");
      return;
    }

    const tasks: TaskItem[] = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== "directory") continue;

      let fileHandle: FileSystemFileHandle;
      try {
        fileHandle = await handle.getFileHandle("task.yaml.orig");
      } catch {
        continue;
      }

      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = YAML.parse(text);
      tasks.push({ slug: name, title: parsed?.title ?? name });
    }

    setTaskList(tasks);
  }

  return (
    <>
      <Button onClick={openModal} className="btn-secondary btn-sm">
        Carica task
      </Button>
      {createPortal(
        <Modal ref={modalRef} title="Carica task">
          <p>Carica la lista dei task del {round.title}</p>

          {supportsDirectoryPicker === false && (
            <div role="alert" className="alert alert-warning text-sm">
              Il tuo browser non supporta la selezione di cartelle. Usa{" "}
              <strong>Google Chrome</strong> per abilitare questa funzione.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="btn-secondary btn-sm"
              disabled={supportsDirectoryPicker === false}
              onClick={handleLoadTaskList}>
              Seleziona cartella
            </Button>
            {taskListError && <p className="text-error text-sm">{taskListError}</p>}
          </div>

          {taskList.length > 0 && (
            <ul className="list-inside list-disc text-sm">
              {taskList.map((task) => (
                <li key={task.slug}>
                  <span className="font-mono">{task.slug}</span> — {task.title}
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <Button className="btn-info btn-sm" onClick={() => modalRef.current?.close()}>
              Chiudi
            </Button>
          </div>
        </Modal>,
        document.body,
      )}
    </>
  );
}

function UploadModalButton({ round }: { round: RoundAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  async function handleUpload({ file }: { file: File }) {
    const formData = new FormData();
    formData.append("file", file);
    await uploadRoundResults(round.editionId, round.slug, formData);
    modalRef.current?.close();
  }

  return (
    <>
      <Button onClick={() => modalRef.current?.showModal()} className="btn-warning btn-sm">
        Carica risultati
      </Button>
      {createPortal(
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
        </Modal>,
        document.body,
      )}
    </>
  );
}

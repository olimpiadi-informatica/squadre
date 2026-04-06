"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button, Form, FormButton, SingleFileField, SubmitButton } from "@olinfo/react-components";
import { saveAs } from "file-saver";
import { BookKey, FileKey, Mail, Upload } from "lucide-react";
import YAML from "yaml";

import { Modal } from "~/components/modal";
import type { RoundAdminItem } from "~/lib/round";

import { getFogliettiPdf, getRoundCredentials, uploadRoundResults } from "./actions";

type TaskItem = { slug: string; title: string };

export function RoundActions({ round }: { round: RoundAdminItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => downloadCredentials(round, false)} className="btn-primary">
        <FileKey className="size-5" />
        Scarica regular.yaml
      </Button>
      {round.slug !== "final" && (
        <Button onClick={() => downloadCredentials(round, true)} className="btn-primary">
          <FileKey className="size-5" />
          Scarica debutant.yaml
        </Button>
      )}
      {round.slug === "final" && (
        <Button onClick={() => downloadFoglietti(round)} className="btn-success">
          <BookKey className="size-5" />
          Scarica foglietti PDF
        </Button>
      )}
      {round.slug !== "final" && (
        <Link
          href={`/admin/edition/${round.editionId}/round/${round.slug}/email`}
          className="btn btn-primary">
          <Mail className="size-5" />
          Gestisci email password
        </Link>
      )}
      <TaskModalButton round={round} />
      <UploadModalButton round={round} />
    </div>
  );
}

async function downloadFoglietti(round: RoundAdminItem) {
  const pdfBytes = await getFogliettiPdf(round.editionId, round.slug);
  saveAs(
    new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }),
    "foglietti.pdf",
  );
}

async function downloadCredentials(round: RoundAdminItem, junior: boolean) {
  const yaml = await getRoundCredentials(round.editionId, round.slug, junior);
  saveAs(new Blob([yaml], { type: "text/yaml" }), junior ? "debutant.yaml" : "regular.yaml");
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
      <Button onClick={openModal} className="btn-primary">
        <Upload className="size-5" />
        Carica task
      </Button>
      <Modal ref={modalRef} title="Carica task">
        <p>Carica la lista dei task del {round.title}</p>

        {supportsDirectoryPicker === false && (
          <div role="alert" className="alert alert-warning text-sm">
            Il tuo browser non supporta la selezione di cartelle. Usa <strong>Google Chrome</strong>{" "}
            per abilitare questa funzione.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="btn-primary"
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
                <span className="font-mono">{task.slug}</span> - {task.title}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <Button className="btn-info" onClick={() => modalRef.current?.close()}>
            Chiudi
          </Button>
        </div>
      </Modal>
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

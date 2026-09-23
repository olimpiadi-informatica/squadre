"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@olinfo/react-components";
import clsx from "clsx";
import { BookKey, FileKey, FileText, Mail, ShieldAlert, Wifi } from "lucide-react";

import type { RoundAdminItem } from "~/lib/round";

import { getMirrorCredentials, getRoundCredentials } from "./actions";
import { ResultsModalButton } from "./results-modal-button";
import { TaskModalButton } from "./task-modal-button";

export function RoundActions({ round }: { round: RoundAdminItem }) {
  const [supportsDirectoryPicker, setSupportsDirectoryPicker] = useState<boolean | null>(null);
  const [isWritingCredentials, setIsWritingCredentials] = useState(false);

  useEffect(() => {
    setSupportsDirectoryPicker("showDirectoryPicker" in window);
  }, []);

  async function handleWriteCredentials() {
    setIsWritingCredentials(true);

    try {
      await writeCredentials(round);
    } finally {
      setIsWritingCredentials(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ul className="steps steps-vertical">
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Task</div>
            <TaskModalButton round={round} />
          </div>
        </li>
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Utenti</div>
            <div
              className={clsx(supportsDirectoryPicker === false && "tooltip")}
              data-tip="È necessario un browser Chromium-based">
              <Button
                onClick={handleWriteCredentials}
                className="btn-primary"
                disabled={supportsDirectoryPicker === false || isWritingCredentials}>
                <FileKey className="size-5" />
                {round.slug === "final" ? "Crea regular.yaml" : "Crea regular.yaml e debutant.yaml"}
              </Button>
            </div>
          </div>
        </li>
        {round.slug === "final" && (
          <li className="step step-primary">
            <div className="flex flex-col items-start gap-2 my-4">
              <div className="text-left text-xl font-semibold">Foglietti</div>

              <Link
                href={`/admin/api/foglietti.pdf?editionId=${encodeURIComponent(round.editionId)}&roundId=${encodeURIComponent(round.slug)}`}
                className="btn btn-primary">
                <BookKey className="size-5" />
                Salva foglietti
              </Link>
            </div>
          </li>
        )}
        {round.slug !== "final" && (
          <li className="step step-primary">
            <div className="flex flex-col items-start gap-2 my-4">
              <div className="text-left text-xl font-semibold">Email</div>

              <Link
                href={`/admin/edition/${round.editionId}/round/${round.slug}/email`}
                className="btn btn-primary">
                <Mail className="size-5" />
                Gestisci email password
              </Link>
            </div>
          </li>
        )}
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Risultati</div>
            <ResultsModalButton round={round} />
          </div>
        </li>
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Resoconto</div>

            <Link
              href={`/admin/edition/${round.editionId}/round/${round.slug}/resoconto`}
              className="btn btn-primary">
              <FileText className="size-5" />
              Visualizza resoconto
            </Link>
          </div>
        </li>
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Internet</div>

            <Link
              href={`/admin/edition/${round.editionId}/round/${round.slug}/internet`}
              className="btn btn-primary">
              <Wifi className="size-5" />
              Controllo internet
            </Link>
          </div>
        </li>
        <li className="step step-primary">
          <div className="flex flex-col items-start gap-2 my-4">
            <div className="text-left text-xl font-semibold">Penalizzazioni</div>

            <Link
              href={`/admin/edition/${round.editionId}/round/${round.slug}/penalization`}
              className="btn btn-primary">
              <ShieldAlert className="size-5" />
              Gestisci penalizzazioni
            </Link>
          </div>
        </li>
      </ul>
    </div>
  );
}

async function writeCredentials(round: RoundAdminItem) {
  let dirHandle: FileSystemDirectoryHandle;
  try {
    dirHandle = await window.showDirectoryPicker();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    throw err;
  }

  const [regularYaml, mirrorRegularYaml, debutantYaml, mirrorDebutantYaml] = await Promise.all([
    getRoundCredentials(round.editionId, round.slug, false),
    getMirrorCredentials(round.editionId, round.slug, false),
    round.slug === "final"
      ? Promise.resolve(null)
      : getRoundCredentials(round.editionId, round.slug, true),
    round.slug === "final"
      ? Promise.resolve(null)
      : getMirrorCredentials(round.editionId, round.slug, true),
  ]);

  await deleteFileIfExists(dirHandle, "contest.yaml");
  await writeTextFile(dirHandle, "regular.yaml", regularYaml);
  await writeTextFile(dirHandle, "mirror-regular.yaml", mirrorRegularYaml);

  if (debutantYaml !== null) {
    await writeTextFile(dirHandle, "debutant.yaml", debutantYaml);
  }

  if (mirrorDebutantYaml !== null) {
    await writeTextFile(dirHandle, "mirror-debutant.yaml", mirrorDebutantYaml);
  }
}

async function deleteFileIfExists(dirHandle: FileSystemDirectoryHandle, fileName: string) {
  try {
    await dirHandle.removeEntry(fileName);
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotFoundError") return;
    throw err;
  }
}

async function writeTextFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string,
) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@olinfo/react-components";
import clsx from "clsx";
import { sortBy } from "es-toolkit";
import { Upload } from "lucide-react";
import YAML from "yaml";
import { z } from "zod";

import { Modal } from "~/components/modal";
import type { RoundAdminItem } from "~/lib/round";
import type { RoundTaskItem } from "~/lib/task";

import { saveRoundTasks } from "./actions";

export function TaskModalButton({ round }: { round: RoundAdminItem }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [supportsDirectoryPicker, setSupportsDirectoryPicker] = useState<boolean | null>(null);
  useEffect(() => {
    setSupportsDirectoryPicker("showDirectoryPicker" in window);
  }, []);

  const [taskList, setTaskList] = useState<RoundTaskItem[] | null>(null);

  function updateTaskFlag(slug: string, flag: "regular" | "junior", value: boolean) {
    setTaskList((prev) =>
      sortBy(
        (prev ?? []).map((task) => (task.slug === slug ? { ...task, [flag]: value } : task)),
        [getTaskSortGroup, "slug"],
      ),
    );
  }

  function openModal() {
    setTaskList(null);
    modalRef.current?.showModal();
  }

  async function handleLoadTaskList() {
    setTaskList(null);

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }

    const contestTasks = await getYamlTaskSet(dirHandle, "contest");
    const debutantTasks = await getYamlTaskSet(dirHandle, "debutant");
    const regularTasks = await getYamlTaskSet(dirHandle, "regular");

    if (!contestTasks && !regularTasks) {
      throw new Error("La directory non contiene contest.yaml o regular.yaml.");
    }
    if (!contestTasks && debutantTasks && !regularTasks) {
      throw new Error("Trovato debutant.yaml ma manca regular.yaml.");
    }

    const tasks: RoundTaskItem[] = [];
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

      let junior = false;
      let regular = false;
      if (contestTasks) {
        junior = true;
        regular = contestTasks.has(name);
      } else if (debutantTasks && regularTasks) {
        junior = debutantTasks.has(name);
        regular = regularTasks.has(name);
      } else if (regularTasks) {
        regular = true;
      }

      tasks.push({ slug: name, title: parsed?.title ?? name, junior, regular });
    }

    setTaskList(sortBy(tasks, [getTaskSortGroup, "slug"]));
  }

  async function handleSaveTasks() {
    if (!taskList) return;

    await saveRoundTasks(round.id, taskList);
    modalRef.current?.close();
  }

  return (
    <>
      <div
        className={clsx(supportsDirectoryPicker === false && "tooltip")}
        data-tip="È necessario un browser Chromium-based">
        <Button
          onClick={openModal}
          className="btn-primary"
          disabled={supportsDirectoryPicker === false}>
          <Upload className="size-5" />
          Carica task
        </Button>
      </div>
      <Modal ref={modalRef} title="Carica task">
        <p>Carica la lista dei task del {round.title}</p>

        {taskList == null ? (
          <div className="flex justify-center mt-2">
            <Button
              className="btn-primary"
              disabled={supportsDirectoryPicker === false}
              onClick={handleLoadTaskList}>
              Seleziona cartella del contest
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Slug</th>
                    <th>Titolo</th>
                    <th className="text-center">Junior</th>
                    <th className="text-center">Regular</th>
                  </tr>
                </thead>
                <tbody>
                  {taskList.map((task) => (
                    <tr key={task.slug}>
                      <td className="font-mono">{task.slug}</td>
                      <td>{task.title}</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={task.junior}
                          onChange={(event) =>
                            updateTaskFlag(task.slug, "junior", event.currentTarget.checked)
                          }
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={task.regular}
                          onChange={(event) =>
                            updateTaskFlag(task.slug, "regular", event.currentTarget.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-2">
              <Button
                className="btn-primary"
                disabled={supportsDirectoryPicker === false}
                onClick={handleSaveTasks}>
                Conferma
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

async function getYamlTaskSet(
  dirHandle: FileSystemDirectoryHandle,
  basename: "contest" | "debutant" | "regular",
): Promise<Set<string> | null> {
  let fileName: string | null = null;
  let fileHandle: FileSystemFileHandle | null = null;
  for (const ext of ["yaml", "yml"]) {
    fileName = `${basename}.${ext}`;
    try {
      fileHandle = await dirHandle.getFileHandle(fileName);
      break;
    } catch {}
  }
  if (!fileHandle) return null;

  const file = await fileHandle.getFile();
  const text = await file.text();
  const parsed = contestYamlSchema.parse(YAML.parse(text));
  return new Set(parsed.tasks);
}

function getTaskSortGroup(task: RoundTaskItem): number {
  if (task.junior && !task.regular) return 0;
  if (task.junior && task.regular) return 1;
  if (!task.junior && task.regular) return 2;
  return 3;
}

const contestYamlSchema = z.object({ tasks: z.string().array() });

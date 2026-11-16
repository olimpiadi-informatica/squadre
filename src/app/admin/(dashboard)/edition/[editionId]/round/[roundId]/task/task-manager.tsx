"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Card, CardBody } from "@olinfo/react-components";
import clsx from "clsx";
import { sortBy } from "es-toolkit";
import { Trash2, Upload } from "lucide-react";
import YAML from "yaml";
import { z } from "zod";

import { Table } from "~/components/table";
import type { RoundTaskItem } from "~/lib/task";

import { saveRoundTasks } from "../actions";

export function TaskManager({
  roundId,
  initialTasks,
}: {
  roundId: number;
  initialTasks: RoundTaskItem[];
}) {
  const [supportsDirectoryPicker, setSupportsDirectoryPicker] = useState<boolean | null>(null);
  const [taskList, setTaskList] = useState<RoundTaskItem[]>(() =>
    sortBy(initialTasks, [getTaskSortGroup, "slug"]),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupportsDirectoryPicker("showDirectoryPicker" in window);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  function scheduleSave(tasks: RoundTaskItem[]) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setIsSaving(true);
      saveRoundTasks(roundId, tasks)
        .then(() => setSaveError(null))
        .catch((err) => setSaveError(err instanceof Error ? err.message : String(err)))
        .finally(() => setIsSaving(false));
    }, 500);
  }

  function updateTaskFlag(slug: string, flag: "regular" | "junior", value: boolean) {
    setTaskList((prev) => {
      const next = sortBy(
        prev.map((task) => (task.slug === slug ? { ...task, [flag]: value } : task)),
        [getTaskSortGroup, "slug"],
      );
      scheduleSave(next);
      return next;
    });
  }

  function deleteTask(slug: string) {
    setTaskList((prev) => {
      const next = prev.filter((task) => task.slug !== slug);
      scheduleSave(next);
      return next;
    });
  }

  async function handleLoadTaskList() {
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
    let directories = 0;
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== "directory") continue;
      directories++;

      const fileHandle = await getTaskYaml(handle);
      if (!fileHandle) continue;

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

      tasks.push({
        slug: name,
        title: parsed?.title ?? name,
        junior,
        regular,
        scoredTeams: 0,
        scoredJuniors: 0,
        scoredRegulars: 0,
      });
    }

    const loaded = sortBy(tasks, [getTaskSortGroup, "slug"]);
    if (loaded.length === 0) {
      throw new Error(
        `Nessun task trovato in "${dirHandle.name}" (${directories} cartelle): ogni sottocartella deve contenere task.yaml.orig o task.yaml. Se le cartelle dei task sono dei symlink il browser non le vede, copia la cartella con \`cp -RL\` e riprova.`,
      );
    }
    setTaskList(loaded);
    scheduleSave(loaded);
  }

  const itemMatch = useCallback(
    (search: string, task: RoundTaskItem) =>
      task.slug.toLowerCase().includes(search) || task.title.toLowerCase().includes(search),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="Carica task">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div
                  className={clsx(supportsDirectoryPicker === false && "tooltip")}
                  data-tip="È necessario un browser Chromium-based">
                  <Button
                    onClick={() => {
                      setSaveError(null);
                      handleLoadTaskList().catch((err) =>
                        setSaveError(err instanceof Error ? err.message : String(err)),
                      );
                    }}
                    className="btn-primary"
                    disabled={supportsDirectoryPicker === false}>
                    <Upload className="size-5" />
                    Seleziona cartella del contest
                  </Button>
                </div>
                {isSaving && <span className="text-sm text-base-content/60">Salvataggio…</span>}
              </div>
              {saveError && (
                <div role="alert" className="alert alert-error text-sm">
                  {saveError}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {taskList.length > 0 && (
        <Table
          data={taskList}
          itemMatch={itemMatch}
          header={TableHeaders}
          row={(props) => <TaskRow {...props} onUpdate={updateTaskFlag} onDelete={deleteTask} />}
          className="grid-cols-[repeat(5,auto)]"
        />
      )}
    </div>
  );
}

function TaskRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: RoundTaskItem;
  onUpdate: (slug: string, flag: "regular" | "junior", value: boolean) => void;
  onDelete: (slug: string) => void;
}) {
  return (
    <>
      <div className="font-mono">{item.slug}</div>
      <div>{item.title}</div>
      <div className="text-center">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={item.junior}
          disabled={item.scoredJuniors > 0 && item.junior}
          onChange={(event) => onUpdate(item.slug, "junior", event.currentTarget.checked)}
        />
      </div>
      <div className="text-center">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={item.regular}
          disabled={item.scoredRegulars > 0 && item.regular}
          onChange={(event) => onUpdate(item.slug, "regular", event.currentTarget.checked)}
        />
      </div>
      <div className="text-center">
        <div
          className={clsx(item.scoredTeams > 0 && "tooltip")}
          data-tip="Il task ha già risultati">
          <Button
            onClick={() => onDelete(item.slug)}
            className="btn-ghost btn-xs text-error"
            disabled={item.scoredTeams > 0}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function TableHeaders() {
  return (
    <>
      <div>Nome breve</div>
      <div>Nome lungo</div>
      <div className="text-center">Junior</div>
      <div className="text-center">Regular</div>
      <div className="text-center">Azioni</div>
    </>
  );
}

async function getTaskYaml(
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileSystemFileHandle | null> {
  // `task.yaml.orig` è la sorgente nei contest recenti, `task.yaml` è il file
  // dei contest più vecchi (dove non esiste ancora il `.orig`).
  for (const fileName of ["task.yaml.orig", "task.yaml"]) {
    try {
      return await dirHandle.getFileHandle(fileName);
    } catch {}
  }
  return null;
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

"use client";

import { useEffect, useRef } from "react";

import * as monaco from "monaco-editor";

self.MonacoEnvironment = {
  getWorker: (_moduleId: string, label: string) => {
    if (label !== "editorWorkerService") throw new Error(`Unknown module: ${label}`);
    return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url));
  },
};

type Submission = {
  submissionLanguage: string | null;
  submissionCode: string | null;
};

function normalizeLanguage(language: string) {
  switch (language) {
    case "py":
      return "python";
    case "cs":
      return "csharp";
    case "cpp":
    case "c":
    case "java":
      return language;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

export default function DiffViewerLazy({
  submissionLeft,
  submissionRight,
}: {
  submissionLeft: Submission;
  submissionRight: Submission;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs";

    const editor = monaco.editor.createDiffEditor(ref.current!, {
      readOnly: true,
      useInlineViewWhenSpaceIsLimited: true,
      theme,
      automaticLayout: true,
    });

    const original = monaco.editor.createModel(
      submissionLeft.submissionCode!,
      normalizeLanguage(submissionLeft.submissionLanguage!),
    );
    const modified = monaco.editor.createModel(
      submissionRight.submissionCode!,
      normalizeLanguage(submissionRight.submissionLanguage!),
    );
    editor.setModel({ original, modified });

    return () => editor.dispose();
  }, [submissionLeft, submissionRight]);

  return <div ref={ref} className="h-full w-full" />;
}

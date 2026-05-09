"use client";

import dynamic from "next/dynamic";

export const DiffViewer = dynamic(() => import("./diff-viewer-lazy"), { ssr: false });

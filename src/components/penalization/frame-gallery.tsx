"use client";

import { useEffect, useRef, useState } from "react";

import clsx from "clsx";
import { intlFormat } from "date-fns";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Modal } from "~/components/modal";
import type { PenalizationFrameDetail } from "~/lib/penalization";

function frameSrc(srcPrefix: string, frame: PenalizationFrameDetail) {
  return `${srcPrefix}/${frame.screenshotId}`;
}

function formatFrameTime(frame: PenalizationFrameDetail) {
  return intlFormat(
    frame.capturedAt ?? frame.recordedAt,
    { timeStyle: "medium", timeZone: "Europe/Rome" },
    { locale: "it-IT" },
  );
}

function FrameImage({
  srcPrefix,
  frame,
  className,
}: {
  srcPrefix: string;
  frame: PenalizationFrameDetail;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center justify-center gap-2 bg-base-200 text-sm opacity-70",
          className,
        )}>
        <ImageOff className="size-8" />
        Frame non disponibile
      </div>
    );
  }

  return (
    <img
      src={frameSrc(srcPrefix, frame)}
      alt="Frame di proctoring"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function FrameGallery({
  frames,
  srcPrefix,
}: {
  frames: PenalizationFrameDetail[];
  srcPrefix: string;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (selected !== null && !modalRef.current?.open) {
      modalRef.current?.showModal();
    }
  }, [selected]);

  function openFrame(index: number) {
    setSelected(index);
    // Se il frame è già quello selezionato lo stato non cambia: apriamo il
    // dialog esplicitamente, così si può riaprire dopo averlo chiuso.
    const dialog = modalRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  const frame = selected === null ? null : frames[selected];
  const hasPrev = selected !== null && selected > 0;
  const hasNext = selected !== null && selected < frames.length - 1;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {frames.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="group flex flex-col gap-2 overflow-hidden rounded-lg border border-base-300 bg-base-100 p-2 text-left transition-colors hover:border-primary"
            onClick={() => openFrame(index)}>
            <FrameImage
              srcPrefix={srcPrefix}
              frame={item}
              className="aspect-video w-full rounded-md border border-base-300 object-cover transition-opacity group-hover:opacity-90"
            />
            <div className="grid gap-1 px-1 pb-1 text-xs opacity-70">
              <p>PC {item.pcHash.slice(0, 8)}</p>
              <p>{formatFrameTime(item)}</p>
            </div>
          </button>
        ))}
      </div>

      <Modal ref={modalRef} title="Frame di proctoring" className="!w-[95vw] !max-w-[1280px]">
        {frame && (
          <div className="flex flex-col gap-3">
            <FrameImage
              key={frame.id}
              srcPrefix={srcPrefix}
              frame={frame}
              className="max-h-[75vh] w-full rounded-md object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="text-xs opacity-70">
                <p>PC {frame.pcHash.slice(0, 8)}</p>
                <p>{formatFrameTime(frame)}</p>
              </div>
              {frames.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setSelected((value) => (value === null ? null : value - 1))}
                    disabled={!hasPrev}
                    title="Frame precedente">
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="text-xs opacity-70">
                    {(selected ?? 0) + 1} / {frames.length}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setSelected((value) => (value === null ? null : value + 1))}
                    disabled={!hasNext}
                    title="Frame successivo">
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

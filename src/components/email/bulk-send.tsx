"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@olinfo/react-components";

import { Modal } from "~/components/modal";
import type { RoundEmailStatus } from "~/lib/email";

type StatusItem = { status: RoundEmailStatus; instituteId: string };

export function BulkSendButton({
  statuses,
  onSend,
}: {
  statuses: StatusItem[];
  onSend: (instituteId: string) => Promise<void>;
}) {
  const router = useRouter();
  const sendModalRef = useRef<HTMLDialogElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const total = useMemo(() => statuses.filter((s) => s.status === "not-sent").length, [statuses]);

  const handleConfirm = useCallback(async () => {
    setProgress(0);
    setIsSending(true);

    for (const status of statuses) {
      if (!sendModalRef.current?.open) break;
      if (status.status === "not-sent") {
        await onSend(status.instituteId);
        setProgress((p) => p + 1);
      }
    }

    setIsSending(false);
    sendModalRef.current?.close();
    router.refresh();
  }, [onSend, router, statuses]);

  return (
    <>
      <Button className="btn-primary" onClick={() => sendModalRef.current?.showModal()}>
        Invia a tutti
      </Button>
      <Modal ref={sendModalRef} title="Invia email a tutti">
        {isSending ? (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Invio in corso, non chiudere questa pagina</p>
            <progress className="progress progress-primary w-full" value={progress} max={total} />
            <p className="text-sm text-center opacity-70">
              {progress} / {total}
            </p>
          </div>
        ) : (
          <>
            <p>Stai per inviare le email agli istituti che non le hanno ancora ricevute.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button className="btn-primary" onClick={() => sendModalRef.current?.close()}>
                Annulla
              </Button>
              <Button onClick={handleConfirm} className="btn-error">
                Conferma
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button, Modal } from "@olinfo/react-components";

import type { RoundEmail } from "~/lib/email";

import { sendEmail } from "./actions";

export function BulkSendButton({
  editionId,
  roundId,
  statuses,
}: {
  editionId: string;
  roundId: string;
  statuses: RoundEmail[];
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
        await sendEmail(editionId, roundId, status.instituteId, false);
        setProgress((p) => p + 1);
      }
    }

    setIsSending(false);
    sendModalRef.current?.close();
    router.refresh();
  }, [editionId, roundId, router, statuses]);

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
            <p>
              Stai per inviare le email con le credenziali a tutti gli istituti che non le hanno
              ancora ricevute.
            </p>
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

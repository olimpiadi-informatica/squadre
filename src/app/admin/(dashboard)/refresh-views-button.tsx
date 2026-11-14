"use client";

import { Button, useNotifications } from "@olinfo/react-components";
import { RefreshCw } from "lucide-react";

import { refreshAllViews } from "./actions";

export function RefreshViewsButton() {
  const { notifySuccess } = useNotifications();

  async function handleRefresh() {
    await refreshAllViews();
    notifySuccess("Aggiornamento delle view avviato in background.");
  }

  return (
    <Button icon={RefreshCw} className="btn-primary" onClick={handleRefresh}>
      Aggiorna view
    </Button>
  );
}

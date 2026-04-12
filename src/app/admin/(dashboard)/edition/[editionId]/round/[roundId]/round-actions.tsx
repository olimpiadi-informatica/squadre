"use client";

import Link from "next/link";

import { Button } from "@olinfo/react-components";
import { saveAs } from "file-saver";
import { BookKey, FileKey, Mail, Wifi } from "lucide-react";

import type { RoundAdminItem } from "~/lib/round";

import { getRoundCredentials } from "./actions";
import { ResultsModalButton } from "./results-modal-button";
import { TaskModalButton } from "./task-modal-button";

export function RoundActions({ round }: { round: RoundAdminItem }) {
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
            <div className="text-left text-xl font-semibold">Internet</div>

            <Link
              href={`/admin/edition/${round.editionId}/round/${round.slug}/internet`}
              className="btn btn-primary">
              <Wifi className="size-5" />
              Controllo internet
            </Link>
          </div>
        </li>
      </ul>
    </div>
  );
}

async function downloadCredentials(round: RoundAdminItem, junior: boolean) {
  const yaml = await getRoundCredentials(round.editionId, round.slug, junior);
  saveAs(new Blob([yaml], { type: "text/yaml" }), junior ? "debutant.yaml" : "regular.yaml");
}

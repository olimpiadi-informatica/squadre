import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@olinfo/react-components";
import { Download } from "lucide-react";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getRoundParticipationStats } from "~/lib/participation";
import { getRoundAdmin } from "~/lib/round";
import { getRoundStatistics } from "~/lib/statistics";

function formatNumber(value: number) {
  return value.toLocaleString("it-IT", { useGrouping: false });
}

function formatCorrelation(value: number | null) {
  return value === null
    ? "–"
    : value.toLocaleString("it-IT", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export default async function AdminRoundStatistichePage({
  params,
}: {
  params: Promise<{ editionId: string; roundId: string }>;
}) {
  await verifyAdmin();

  const { editionId, roundId } = await params;
  const [edition, round, stats] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
    getRoundParticipationStats(editionId, roundId),
  ]);
  if (!edition || !round) notFound();

  const roundStats = await getRoundStatistics(round.id);
  const regionTotals = roundStats.regions.reduce(
    (acc, reg) => ({
      points: acc.points + reg.points,
      positives: acc.positives + reg.positives,
    }),
    { points: 0, positives: 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/admin">Tutte le edizioni</Link>
          </li>
          <li>
            <Link href={`/admin/edition/${editionId}`}>{edition.name}</Link>
          </li>
          <li>
            <Link href={`/admin/edition/${editionId}/round/${roundId}`}>{round.title}</Link>
          </li>
          <li>Statistiche</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold">Statistiche {round.title}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="PARTECIPAZIONE">
            <div className="flex flex-col gap-2 text-base">
              <p>
                {stats.loggedCount} su {stats.totalTeams} squadre ({stats.loggedPercent}%) si sono
                collegate
              </p>
              <p>
                Di queste, in {stats.submittedCount} ({stats.submittedPercent}%) hanno tentato
                almeno una sottoposizione
              </p>
              <p>
                Di queste, in {stats.scoredCount} ({stats.scoredPercent}%) hanno fatto punti
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody title="Scarica elenchi squadre">
            <div className="flex flex-col gap-3">
              <p className="text-sm opacity-70">
                Scarica i file di testo con l&apos;elenco degli identificativi delle squadre (utenti
                hidden esclusi).
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/statistiche/logged.txt`}
                  download="logged.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  logged.txt ({stats.loggedCount})
                </a>
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/statistiche/submitted.txt`}
                  download="submitted.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  submitted.txt ({stats.submittedCount})
                </a>
                <a
                  href={`/admin/edition/${editionId}/round/${roundId}/statistiche/scored.txt`}
                  download="scored.txt"
                  className="btn btn-outline btn-sm">
                  <Download className="size-4" />
                  scored.txt ({stats.scoredCount})
                </a>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody title="Statistiche per Regioni">
          <p className="text-sm opacity-70 mb-2">
            Squadre squalificate escluse. Punti: somma dei punti delle squadre della regione.
            Positivi: squadre con almeno un punto.
          </p>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Regione</th>
                  <th className="text-right">Punti</th>
                  <th className="text-right">Positivi</th>
                </tr>
              </thead>
              <tbody>
                {roundStats.regions.map((reg) => (
                  <tr key={reg.id}>
                    <td>{reg.name}</td>
                    <td className="text-right">{formatNumber(reg.points)}</td>
                    <td className="text-right">{formatNumber(reg.positives)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td>Totale</td>
                  <td className="text-right">{formatNumber(regionTotals.points)}</td>
                  <td className="text-right">{formatNumber(regionTotals.positives)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody title="Statistiche per Problemi">
          <p className="text-sm opacity-70">
            Partecipanti: {formatNumber(roundStats.participants)} · Punti medi:{" "}
            {formatNumber(roundStats.averagePoints)}
          </p>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Problema</th>
                  <th className="text-right">Punti totali</th>
                  <th className="text-right">Punteggi pieni</th>
                  <th className="text-right">Punteggi positivi</th>
                  <th className="text-right">Correlazione</th>
                </tr>
              </thead>
              <tbody>
                {roundStats.tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{`${t.slug} (${t.title})`}</td>
                    <td className="text-right">{formatNumber(t.totalPoints)}</td>
                    <td className="text-right">{formatNumber(t.fullScores)}</td>
                    <td className="text-right">{formatNumber(t.positiveScores)}</td>
                    <td className="text-right">{formatCorrelation(t.correlation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getInstitutePenalizationAccess,
  getPenalizationAppealStatus,
  listInstitutePenalizations,
} from "~/lib/penalization";

const levelLabel = {
  yellow: "Giallo",
  red: "Rosso",
} as const;

const levelBadge = {
  yellow: "badge-warning",
  red: "badge-error",
} as const;

const typeLabel = {
  "screen-recording": "Screen recording",
  "internet-check": "Internet",
  plagiarism: "Copiatura",
  ai: "Uso di strumenti AI",
  other: "Violazione del codice d'onore",
} as const;

export default async function TeacherPenalizationPage({ params }: PageProps<"/teacher/p/[token]">) {
  const { token } = await params;
  const [access, penalizations] = await Promise.all([
    getInstitutePenalizationAccess(token),
    listInstitutePenalizations(token),
  ]);
  if (!access) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Penalizzazioni {access.roundTitle}</h1>
      </header>

      {penalizations.length === 0 ? (
        <p className="opacity-70">Nessuna penalizzazione presente per questo round.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Squadra</th>
                <th>Livello</th>
                <th>Tipo</th>
                <th>Stato</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {penalizations.map((item) => (
                <tr key={item.id}>
                  <td>{item.teams}</td>
                  <td>
                    <span className={`badge badge-sm ${levelBadge[item.level]}`}>
                      {levelLabel[item.level]}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-sm badge-outline">{typeLabel[item.type]}</span>
                  </td>
                  <td>{getPenalizationAppealStatus(item)}</td>
                  <td className="text-end">
                    <Link
                      className="btn btn-primary btn-sm"
                      href={`/teacher/p/${token}/${item.id}`}>
                      Dettaglio
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

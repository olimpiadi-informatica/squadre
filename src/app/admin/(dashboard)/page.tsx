import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { verifyAdmin } from "~/lib/admin";
import { listEditionsAdmin } from "~/lib/edition";

import { AdminEditionsTable } from "./editions-table";
import { NewEditionButton } from "./new-edition-button";
import { RefreshViewsButton } from "./refresh-views-button";

export default async function AdminPage() {
  await verifyAdmin();

  const editions = await listEditionsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title="Nuova edizione">
            <p>Per creare una nuova edizione sono necessari i seguenti dati:</p>
            <ul className="list-disc ml-4">
              <li>
                <a
                  href={`https://olimpiadi-scientifiche.it/edition/ois${(new Date().getFullYear() + 1) % 100}/admin/competitors`}
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary">
                  CSV con i partecipanti
                </a>
              </li>
              <li>
                <a
                  href="https://oisquadre.it/calendario/"
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary">
                  le date dei round
                </a>
              </li>
            </ul>
            <CardActions>
              <NewEditionButton editions={editions} />
            </CardActions>
          </CardBody>
        </Card>
        <Card>
          <CardBody title="Aggiorna statistiche">
            <p>
              Ricalcola in background le statistiche. L&apos;operazione può richiedere qualche
              minuto.
            </p>
            <CardActions>
              <RefreshViewsButton />
            </CardActions>
          </CardBody>
        </Card>
      </div>
      <div className="w-full">
        <AdminEditionsTable editions={editions} />
      </div>
    </div>
  );
}

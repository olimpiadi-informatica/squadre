import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { listEditionsAdmin } from "~/lib/edition";

import { AdminEditionsTable } from "./editions-table";
import { NewEditionButton } from "./new-edition-button";

export default async function AdminPage() {
  const editions = await listEditionsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>Editions</li>
        </ul>
      </div>
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
                  href="https://sites.google.com/aldini.istruzioneer.it/olimpiadi-informatica-squadre/homepage"
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary">
                  le date dei round
                </a>
              </li>
            </ul>
            <CardActions>
              <NewEditionButton />
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

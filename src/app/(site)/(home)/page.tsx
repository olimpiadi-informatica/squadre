import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { getLatestSchedule } from "~/lib/edition";

import { Schedule } from "./schedule";

export const dynamic = "force-dynamic";
export default async function Page() {
  const schedule = await getLatestSchedule();

  const years = schedule.year;
  const rounds = schedule.rounds;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardBody title={`OIS ${years}`}>
          <p className="font-bold text-base-content/60">Official contest</p>
          <p>
            If you are an officially participating team and you have received an official username
            and password to participate in the main contest, click here:
          </p>
          <CardActions>
            <a
              href="https://gara.squadre.olinfo.it/"
              target="_blank"
              className="btn btn-primary"
              rel="noreferrer">
              Official contest
            </a>
            <a
              href="https://gara.squadre.olinfo.it/ranking"
              target="_blank"
              className="btn btn-primary"
              rel="noreferrer">
              Official ranking
            </a>
          </CardActions>
        </CardBody>
      </Card>
      <Card>
        <CardBody title={`IIOT Open Contests ${years}`}>
          <p className="font-bold text-base-content/60">Mirrored, open contest</p>
          <p>
            If you don't have an official username and password and you want to signup for a new
            account and participate in the mirrored contest, click here:
          </p>
          <CardActions>
            <a
              href="https://mirror.squadre.olinfo.it/"
              target="_blank"
              className="btn btn-primary"
              rel="noreferrer">
              Mirror contest
            </a>
            <a
              href="https://mirror.squadre.olinfo.it/ranking"
              target="_blank"
              className="btn btn-primary"
              rel="noreferrer">
              Mirror ranking
            </a>
          </CardActions>
        </CardBody>
      </Card>
      <Card className="col-span-full">
        <CardBody title="Schedule">
          <Schedule rounds={rounds} />
        </CardBody>
      </Card>
    </div>
  );
}

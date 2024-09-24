import { tzDate } from "@formkit/tempo";
import { Card, CardActions, CardBody } from "@olinfo/react-components";

import { Schedule } from "./schedule";

export default function Page() {
  const rounds = [
    tzDate("2024-11-11 14:30", "Europe/Rome"),
    tzDate("2024-12-10 14:30", "Europe/Rome"),
    tzDate("2025-01-15 14:30", "Europe/Rome"),
    tzDate("2025-02-06 14:30", "Europe/Rome"),
  ];
  const final = tzDate("2025-03-14 14:30", "Europe/Rome");

  const year = rounds[0].getFullYear();
  const years = `${year}/${(year + 1) % 100}`;

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
          <Schedule rounds={rounds} final={final} />
        </CardBody>
      </Card>
    </div>
  );
}

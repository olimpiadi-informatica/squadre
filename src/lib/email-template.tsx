import { render } from "@react-email/components";

import PasswordEmail from "~/emails/password-email";
import type { TeamCredential } from "~/lib/team";

export function renderPasswordEmail(
  coach: string,
  roundName: string,
  editionName: string,
  teams: TeamCredential[],
  startTime: string,
) {
  return render(
    <PasswordEmail
      coach={coach}
      roundName={roundName}
      editionName={editionName}
      teams={teams}
      startTime={startTime}
    />,
  );
}

import { render } from "@react-email/components";

import PasswordEmail from "~/emails/password-email";
import type { TeamCredential } from "~/lib/team";

export function renderPasswordEmail(
  coach: string,
  roundName: string,
  editionYear: string,
  teams: TeamCredential[],
  startTime: string,
  credentialsPdfUrl: string,
) {
  return render(
    <PasswordEmail
      coach={coach}
      roundName={roundName}
      editionYear={editionYear}
      teams={teams}
      startTime={startTime}
      credentialsPdfUrl={credentialsPdfUrl}
    />,
  );
}

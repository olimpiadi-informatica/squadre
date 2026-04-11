import { render } from "@react-email/components";
import { eq } from "drizzle-orm";

import PasswordEmail from "~/emails/password-email";
import { db } from "~/lib/db";
import { emailTemplate } from "~/lib/db/schema";
import type { TeamCredential } from "~/lib/team";

export const PASSWORD_EMAIL_TEMPLATE_ID = "password";

export function renderPasswordEmail(
  coach: string,
  roundName: string,
  editionYear: string,
  teams: TeamCredential[],
  startTime: string,
  credentialsPdfUrl: string,
  template: string,
) {
  return render(
    <PasswordEmail
      coach={coach}
      roundName={roundName}
      editionYear={editionYear}
      teams={teams}
      startTime={startTime}
      credentialsPdfUrl={credentialsPdfUrl}
      template={template}
    />,
  );
}

export async function getEmailTemplateContent(id: string): Promise<string | null> {
  const [result] = await db
    .select({ content: emailTemplate.content })
    .from(emailTemplate)
    .where(eq(emailTemplate.id, id))
    .limit(1);
  return result?.content ?? null;
}

export async function upsertEmailTemplateContent(id: string, content: string): Promise<void> {
  await db.insert(emailTemplate).values({ id, content }).onConflictDoUpdate({
    target: emailTemplate.id,
    set: { content },
  });
}

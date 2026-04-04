import type { NextRequest } from "next/server";

import { verifyAdmin } from "~/lib/admin";
import { getInstituteEmailHtml } from "~/lib/email";

type RouteContext = {
  params: Promise<{ emailId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  await verifyAdmin();

  const { emailId } = await params;
  const html = await getInstituteEmailHtml(Number(emailId));

  if (!html) {
    return new Response("Email not found", { status: 404 });
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

import { verifyAdmin } from "~/lib/admin";
import { readScreenshotFile } from "~/lib/screenshot";

type RouteContext = {
  params: Promise<{ screenshotId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  await verifyAdmin();

  const { screenshotId } = await params;
  const id = Number.parseInt(screenshotId, 10);
  if (Number.isNaN(id)) {
    return new Response("Invalid screenshot id", { status: 400 });
  }

  const file = await readScreenshotFile(id);
  if (!file) {
    return new Response("Screenshot not found", { status: 404 });
  }

  return new Response(file.data as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

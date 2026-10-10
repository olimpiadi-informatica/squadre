import type { NextRequest } from "next/server";

import { verifyAdmin } from "~/lib/admin";
import { getEditionAdmin } from "~/lib/edition";
import { getParticipationFileContent, type ParticipationFileType } from "~/lib/participation";
import { getRoundAdmin } from "~/lib/round";

const VALID_FILES: Record<string, ParticipationFileType> = {
  "logged.txt": "logged",
  "submitted.txt": "submitted",
  "scored.txt": "scored",
};

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      editionId: string;
      roundId: string;
      file: string;
    }>;
  },
) {
  await verifyAdmin();

  const { editionId, roundId, file } = await params;

  const fileType = VALID_FILES[file];
  if (!fileType) {
    return new Response("File non trovato", { status: 404 });
  }

  const [edition, round] = await Promise.all([
    getEditionAdmin(editionId),
    getRoundAdmin(editionId, roundId),
  ]);

  if (!edition || !round) {
    return new Response("Round non trovato", { status: 404 });
  }

  const content = await getParticipationFileContent(editionId, round.slug, fileType);

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}

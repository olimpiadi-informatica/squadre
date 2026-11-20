import { Card, CardBody } from "@olinfo/react-components";

import { getPenalizationFrames } from "~/lib/penalization";

import { FrameGallery } from "./frame-gallery";

export async function PenalizationFrames({ penalizationId }: { penalizationId: number }) {
  const frames = await getPenalizationFrames(penalizationId);
  if (frames.length === 0) return null;

  return (
    <Card>
      <CardBody title="Registrazione">
        <FrameGallery frames={frames} />
      </CardBody>
    </Card>
  );
}

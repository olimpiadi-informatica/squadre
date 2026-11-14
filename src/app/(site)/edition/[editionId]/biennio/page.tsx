import { EditionView, editionMetadata } from "~/app/(site)/_views/edition";
import { BIENNIO } from "~/lib/championship-path";

export const generateMetadata = editionMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]/biennio">) {
  return <EditionView params={params} category={BIENNIO} />;
}

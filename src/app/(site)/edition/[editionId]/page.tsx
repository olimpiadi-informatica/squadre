import { EditionView, editionMetadata } from "~/app/(site)/_views/edition";
import { REGOLARI } from "~/lib/championship-path";

export const generateMetadata = editionMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]">) {
  return <EditionView params={params} category={REGOLARI} />;
}

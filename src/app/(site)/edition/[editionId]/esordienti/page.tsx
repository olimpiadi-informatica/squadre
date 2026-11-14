import { EditionView, editionMetadata } from "~/app/(site)/_views/edition";
import { ESORDIENTI } from "~/lib/championship-path";

export const generateMetadata = editionMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]/esordienti">) {
  return <EditionView params={params} category={ESORDIENTI} />;
}

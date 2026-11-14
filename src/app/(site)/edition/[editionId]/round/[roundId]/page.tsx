import { RoundView, roundMetadata } from "~/app/(site)/_views/round";
import { REGOLARI } from "~/lib/championship-path";

export const generateMetadata = roundMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]/round/[roundId]">) {
  return <RoundView params={params} category={REGOLARI} />;
}

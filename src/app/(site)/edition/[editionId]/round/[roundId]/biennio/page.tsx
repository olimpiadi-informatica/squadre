import { RoundView, roundMetadata } from "~/app/(site)/_views/round";
import { BIENNIO } from "~/lib/championship-path";

export const generateMetadata = roundMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/biennio">) {
  return <RoundView params={params} category={BIENNIO} />;
}

import { RoundView, roundMetadata } from "~/app/(site)/_views/round";
import { ESORDIENTI } from "~/lib/championship-path";

export const generateMetadata = roundMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/esordienti">) {
  return <RoundView params={params} category={ESORDIENTI} />;
}

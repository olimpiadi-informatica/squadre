import { TeamView, teamMetadata } from "~/app/(site)/_views/team";
import { BIENNIO } from "~/lib/championship-path";

export const generateMetadata = teamMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]/team/[teamId]/biennio">) {
  return <TeamView params={params} category={BIENNIO} />;
}

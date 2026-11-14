import { TeamView, teamMetadata } from "~/app/(site)/_views/team";
import { REGOLARI } from "~/lib/championship-path";

export const generateMetadata = teamMetadata;

export default function Page({ params }: PageProps<"/edition/[editionId]/team/[teamId]">) {
  return <TeamView params={params} category={REGOLARI} />;
}

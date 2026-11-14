import { TeamView, teamMetadata } from "~/app/(site)/_views/team";
import { ESORDIENTI } from "~/lib/championship-path";

export const generateMetadata = teamMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/team/[teamId]/esordienti">) {
  return <TeamView params={params} category={ESORDIENTI} />;
}

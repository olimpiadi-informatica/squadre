import { TaskView, taskMetadata } from "~/app/(site)/_views/task";
import { BIENNIO } from "~/lib/championship-path";

export const generateMetadata = taskMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]/biennio">) {
  return <TaskView params={params} category={BIENNIO} />;
}

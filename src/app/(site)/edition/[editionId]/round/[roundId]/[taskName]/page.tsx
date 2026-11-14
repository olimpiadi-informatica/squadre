import { TaskView, taskMetadata } from "~/app/(site)/_views/task";
import { REGOLARI } from "~/lib/championship-path";

export const generateMetadata = taskMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]">) {
  return <TaskView params={params} category={REGOLARI} />;
}

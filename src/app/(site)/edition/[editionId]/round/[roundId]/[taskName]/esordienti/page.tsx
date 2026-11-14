import { TaskView, taskMetadata } from "~/app/(site)/_views/task";
import { ESORDIENTI } from "~/lib/championship-path";

export const generateMetadata = taskMetadata;

export default function Page({
  params,
}: PageProps<"/edition/[editionId]/round/[roundId]/[taskName]/esordienti">) {
  return <TaskView params={params} category={ESORDIENTI} />;
}

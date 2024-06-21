import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Card, CardBody } from "@olinfo/react-components";

import { Highlights } from "~/components/highlights";
import { getEdition } from "~/lib/edition";
import { getEditions } from "~/lib/editions";
import { getRound } from "~/lib/round";

import { RoundTable } from "./table";

type Props = {
  params: { editionId: string; roundId: string };
};

export async function generateStaticParams() {
  const editions = await getEditions();
  const params = await Promise.all(
    editions.editions.map(async ({ id }) => {
      const edition = await getEdition(id);
      const rounds = edition.contests.map(({ id: roundId }): Props["params"] => ({
        editionId: id.toString(),
        roundId,
      }));
      if (edition.final) {
        rounds.push({ editionId: id.toString(), roundId: "final" });
      }
      return rounds;
    }),
  );
  return params.flat();
}

export async function generateMetadata({
  params: { editionId, roundId },
}: Props): Promise<Metadata> {
  const round = await getRound(editionId, roundId);

  return {
    title: `OIS - ${round.title}, ${round.edition}`,
  };
}

export default async function Page({ params: { editionId, roundId } }: Props) {
  const round = await getRound(editionId, roundId);

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs mx-4 text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/edition">Rankings</Link>
          </li>
          <li>
            <Link href={`/edition/${round.ed_num}`}>{round.edition}</Link>
          </li>
          <li>{round.title}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody title={round.title}>
            <p>
              {round.positive} teams scored {round.points} points on {round.tasks.length} tasks, for
              an average score of {Math.round(round.avgpos)} and a median score of{" "}
              {Math.round(round.medpos)}.
            </p>
          </CardBody>
        </Card>
        <Highlights highlights={round.highlights} />
      </div>
      <div className="w-full" style={{ "--cols": round.tasks.length } as CSSProperties}>
        <RoundTable round={round} />
      </div>
    </div>
  );
}

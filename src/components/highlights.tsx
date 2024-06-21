import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";

import type { Highlight } from "~/lib/common";

export function Highlights({ highlights }: { highlights: Highlight[] }) {
  return (
    <Card>
      <CardBody title="Highlights">
        <ol className="list-decimal pl-6">
          {highlights.map((highlight, i) => (
            <li key={i}>
              <Link href={highlight.id} className="link">
                {highlight.name}
              </Link>{" "}
              {highlight.description}.
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

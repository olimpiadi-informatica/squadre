import Link from "next/link";

import { Card, CardBody } from "@olinfo/react-components";
import type { AppRoutes } from "routes";

import { getHighlights } from "~/lib/highlights";

export async function Highlights({ page }: { page: string }) {
  const highlights = await getHighlights(page);

  return (
    <Card>
      <CardBody title="Highlights">
        <ol className="list-decimal pl-6">
          {highlights.map((highlight) => (
            <li key={highlight.id}>
              <Link href={highlight.link as AppRoutes} className="link">
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

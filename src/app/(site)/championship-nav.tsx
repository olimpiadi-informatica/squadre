import type { Route } from "next";
import Link from "next/link";

import { Tabs } from "@olinfo/react-components";
import clsx from "clsx";

export type ChampionshipLink = {
  slug: string;
  label: string;
  href: string;
};

/**
 * Selettore del campionato di una pagina.
 *
 * Sono semplici link alle pagine dei singoli campionati: la navigazione e
 * l'aggiornamento dell'URL li gestisce Next, niente `window.history`.
 */
export function ChampionshipNav({ links, active }: { links: ChampionshipLink[]; active?: string }) {
  if (links.length <= 1) return null;

  return (
    <Tabs>
      {links.map((link) => (
        <Link
          key={link.slug}
          href={link.href as Route}
          aria-current={link.slug === active ? "page" : undefined}
          className={clsx("tab", link.slug === active && "tab-active")}>
          {link.label}
        </Link>
      ))}
    </Tabs>
  );
}

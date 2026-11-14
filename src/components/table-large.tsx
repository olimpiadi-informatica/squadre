import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";
import { type Components, Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import type { TableProps } from "./table";
import style from "./table.module.css";
import { TableSearch } from "./table-search";

// Nome registrato in `CSS.highlights`; la regola `::highlight(...)` sta in globals.css.
const SEARCH_HIGHLIGHT = "table-search";

export default function LargeTable<T>({
  data,
  itemMatch,
  header: Header,
  row: Row,
  className,
}: TableProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  // larghezza del riquadro: `undefined` al primo render, così non parte da 0
  const [width, setWidth] = useState<number>();

  // Le colonne NON vengono congelate in pixel: il template è quello della
  // classe CSS passata dal chiamante e header/righe lo condividono con
  // `grid-cols-subgrid`, quindi restano allineati. Misurare le colonne e
  // riscriverle in pixel causava flicker al cambio di tab, perché Virtuoso
  // aggiorna le celle dopo il commit (la misura risultava vecchia).
  const updateWidth = useCallback(() => {
    const viewport = ref.current?.children[0]?.children[0];
    if (viewport) setWidth(viewport.scrollWidth + 2);
  }, []);

  // prima del primo disegno: il riquadro non deve mai apparire con la
  // larghezza provvisoria
  useLayoutEffect(() => {
    updateWidth();
  }, [updateWidth]);

  useLayoutEffect(() => {
    const obs = new ResizeObserver(() => updateWidth());

    const viewport = ref.current?.children[0].children[0];
    if (viewport) obs.observe(viewport);
    return () => obs.disconnect();
  }, [updateWidth]);

  useEffect(() => {
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  const virtuoso = useRef<VirtuosoHandle>(null);
  const [highlightedRow, setHighlightedRow] = useState(-1);
  const [query, setQuery] = useState("");

  const highlightRow = useCallback((index: number) => {
    setHighlightedRow(index);
    if (index !== -1) {
      virtuoso.current?.scrollToIndex({ index, align: "center", behavior: "smooth" });
    }
  }, []);

  return (
    <div className={style.outerContainer}>
      <div className={style.innerContainer} ref={ref} style={{ width }}>
        <Virtuoso<T>
          ref={virtuoso}
          data={data}
          itemContent={(_index, item) => <Row item={item} />}
          components={{ Header, Footer, List, Item }}
          increaseViewportBy={200}
          initialItemCount={10}
          className={clsx(style.scroller, className)}
          context={{ highlightedRow, query }}
          useWindowScroll
        />
      </div>
      {createPortal(
        <TableSearch
          data={data}
          itemMatch={itemMatch}
          highlightRow={highlightRow}
          onQueryChange={setQuery}
        />,
        document.body,
      )}
    </div>
  );
}

const List: Components["List"] = forwardRef(({ context: _context, ...props }, ref) => {
  return <div ref={ref} {...props} className={style.list} />;
});

const Item: Components<any, { highlightedRow: number; query: string }>["Item"] = ({
  context,
  "data-index": index,
  item: _item,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isHighlighted = context.highlightedRow === index;
  const query = context.query;

  // Evidenzia il testo che matcha la ricerca con le CSS Custom Highlight API:
  // niente manipolazione del DOM (React resta l'unico proprietario del markup),
  // basta registrare i `Range` delle occorrenze trovate nella riga.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !isHighlighted || !query || !CSS.highlights) return;

    const ranges: Range[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const haystack = text.toLowerCase();
      let from = 0;
      let at = haystack.indexOf(query, from);
      while (at !== -1) {
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + query.length);
        ranges.push(range);
        from = at + query.length;
        at = haystack.indexOf(query, from);
      }
    }

    if (ranges.length === 0) return;
    CSS.highlights.set(SEARCH_HIGHLIGHT, new Highlight(...ranges));
    return () => {
      CSS.highlights.delete(SEARCH_HIGHLIGHT);
    };
  }, [isHighlighted, query]);

  return (
    <div
      data-index={index}
      {...props}
      ref={ref}
      className={clsx(style.item, isHighlighted && style.itemHighlight)}
    />
  );
};

const Footer: Components["Footer"] = () => <Fragment />;

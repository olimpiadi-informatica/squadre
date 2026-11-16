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
  // larghezze delle colonne congelate al primo render: `undefined` finché non
  // sono state misurate
  const [gridTemplateColumns, setGridTemplateColumns] = useState<string>();

  const updateWidth = useCallback(() => {
    const viewport = ref.current?.children[0]?.children[0];
    if (viewport) setWidth(viewport.scrollWidth + 2);
  }, []);

  // Congela le larghezze delle colonne al primo rendering. Virtuoso monta e
  // smonta le righe mentre si scorre: con le colonne `auto` + subgrid ogni
  // riga contribuirebbe al ridimensionamento delle tracce, facendole cambiare
  // larghezza durante lo scroll. Fissandole in pixel una volta sola le colonne
  // restano stabili (le prime righe, `initialItemCount`, sono già nel DOM).
  const updateColumnWidths = useCallback(() => {
    const viewport = ref.current?.children[0]?.children[0];
    const headers = viewport?.children[0];
    if (!headers) return;

    const widths = Array.from(headers.children, (header, i) => {
      // `Item` ha p-2: aggiungiamo il padding alle colonne di bordo
      const padding = i === 0 || i === headers.children.length - 1 ? 8 : 0;
      return header.clientWidth + padding;
    });
    // se la tabella non è ancora stata disposta le larghezze sono tutte 0
    if (widths.length > 0 && widths.some((column) => column > 0)) {
      setGridTemplateColumns(widths.map((column) => `${column}px`).join(" "));
    }
  }, []);

  // prima del primo disegno: né il riquadro né le colonne devono mai apparire
  // con la larghezza provvisoria
  useLayoutEffect(() => {
    updateColumnWidths();
    updateWidth();
  }, [updateColumnWidths, updateWidth]);

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
          style={{ gridTemplateColumns }}
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

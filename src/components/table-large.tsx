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

export default function LargeTable<T>({
  data,
  itemMatch,
  header: Header,
  row: Row,
  className,
}: TableProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [gridTemplateColumns, setGridTemplateColumns] = useState<string | undefined>();

  useLayoutEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const viewport = entries[0];
      setWidth(viewport.target.scrollWidth + 2);
    });

    const viewport = ref.current?.children[0].children[0];
    if (viewport) obs.observe(viewport);
    return () => obs.disconnect();
  }, []);

  const updateColumnWidths = useCallback(() => {
    if (!ref.current) return;
    const viewport = ref.current.children[0].children[0];
    const headers = viewport.children[0];
    const headerWidths = Array.from(
      headers.children,
      (header, i) => header.clientWidth + (i === 0 || i === headers.children.length - 1 ? 8 : 0),
    );
    setGridTemplateColumns(headerWidths.map((header) => `${header}px`).join(" "));
  }, []);

  useEffect(() => {
    updateColumnWidths();

    const abortController = new AbortController();
    let id: ReturnType<typeof setTimeout> | undefined;

    window.addEventListener(
      "resize",
      () => {
        clearTimeout(id);
        setGridTemplateColumns(undefined);
        id = setTimeout(() => updateColumnWidths(), 20);
      },
      { signal: abortController.signal },
    );

    return () => abortController.abort();
  }, [updateColumnWidths]);

  const virtuoso = useRef<VirtuosoHandle>(null);
  const [highlightedRow, setHighlightedRow] = useState(-1);

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
          context={{ highlightedRow }}
          useWindowScroll
        />
      </div>
      {createPortal(
        <TableSearch data={data} itemMatch={itemMatch} highlightRow={highlightRow} />,
        document.body,
      )}
    </div>
  );
}

const List: Components["List"] = forwardRef(({ context: _context, ...props }, ref) => {
  return <div ref={ref} {...props} className={style.list} />;
});

const Item: Components<any, { highlightedRow: number }>["Item"] = ({
  context,
  "data-index": index,
  item: _item,
  ...props
}) => {
  return (
    <div
      data-index={index}
      {...props}
      className={clsx(style.item, context.highlightedRow === index && style.itemHighlight)}
    />
  );
};

const Footer: Components["Footer"] = () => <Fragment />;

import {
  type InputEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import clsx from "clsx";
import { ChevronDown, ChevronUp, SearchIcon } from "lucide-react";

export function TableSearch<T>({
  data,
  itemMatch,
  highlightRow,
}: {
  data: T[];
  itemMatch: (search: string, item: T) => boolean;
  highlightRow: (index: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const currentValue = useCallback(() => ref.current!.value.trim().toLowerCase(), []);

  const [isOpen, setIsOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<number>(-1);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentRow(-1);
    highlightRow(-1);
  }, [highlightRow]);

  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      "keydown",
      (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "f") {
          event.preventDefault();
          setIsOpen(true);
        }
        if (event.key === "Escape") {
          close();
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [close]);

  const findPrev = useCallback(
    (value: string, fromIndex = Number.POSITIVE_INFINITY) => {
      return data.findLastIndex((item, index) => index < fromIndex && itemMatch(value, item));
    },
    [data, itemMatch],
  );

  const findNext = useCallback(
    (value: string, fromIndex = -1) => {
      return data.findIndex((item, index) => index > fromIndex && itemMatch(value, item));
    },
    [data, itemMatch],
  );

  const onInput = useCallback(
    (event: InputEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.trim().toLowerCase();
      if (!value) {
        setCurrentRow(-1);
        highlightRow(-1);
        return;
      }

      const index = findNext(value);
      setCurrentRow(index);
      highlightRow(index);
    },
    [findNext, highlightRow],
  );

  const prev = () => {
    let index = findPrev(currentValue(), currentRow);
    if (index === -1) index = findPrev(currentValue());
    setCurrentRow(index);
    highlightRow(index);
  };

  const next = () => {
    let index = findNext(currentValue(), currentRow);
    if (index === -1) index = findNext(currentValue());
    setCurrentRow(index);
    highlightRow(index);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") next();
    if (event.key === "Escape") close();
    if (event.key === "ArrowUp") {
      event.preventDefault();
      prev();
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex justify-end fixed top-16 right-0 p-4">
      <div className="join bg-base-300 *:border-base-content/20">
        <div className="btn btn-outline btn-disabled join-item">
          <SearchIcon />
        </div>
        <input
          ref={ref}
          aria-label="Search"
          className={clsx(
            "input join-item input-bordered",
            currentRow === -1 && ref.current?.value && "input-error",
          )}
          onInput={onInput}
          onKeyDown={onKeyDown}
          type="search"
          placeholder="Search"
          // biome-ignore lint/a11y/noAutofocus: default behavior for ctrl+f
          autoFocus
        />
        <div className="join-item flex flex-col justify-around border">
          <button
            type="button"
            aria-label="Previous result"
            disabled={currentRow === -1}
            onClick={prev}>
            <ChevronUp size={16} className="mx-1" />
          </button>
          <button
            type="button"
            aria-label="Next result"
            disabled={currentRow === -1}
            onClick={next}>
            <ChevronDown size={16} className="mx-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

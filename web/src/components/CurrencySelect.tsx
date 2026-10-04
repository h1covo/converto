import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "../hooks/useI18n";
import { filterCurrencies } from "../lib/currencySearch";
import {
  CURRENCY_LIST,
  currencyName,
  type CurrencyCode,
  type CurrencyMeta,
} from "../lib/currencies";

interface CurrencySelectProps {
  id: string;
  label: string;
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  align?: "left" | "right";
}

function Magnifier() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function CurrencySelect({
  id,
  label,
  value,
  onChange,
  align = "left",
}: CurrencySelectProps) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selected = CURRENCY_LIST.find((meta) => meta.code === value)!;
  const filtered = useMemo(() => filterCurrencies(query), [query]);
  const options = query === "" ? CURRENCY_LIST : filtered;

  useEffect(() => {
    if (!open) return;
    function onDocumentDown(event: globalThis.MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentDown);
    return () => document.removeEventListener("mousedown", onDocumentDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const initial = CURRENCY_LIST.findIndex((meta) => meta.code === value);
    setActiveIndex(initial < 0 ? 0 : initial);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, value]);

  useEffect(() => {
    if (query !== "") setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function close(focusTrigger: boolean) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function choose(meta: CurrencyMeta) {
    onChange(meta.code);
    close(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const meta = options[activeIndex];
      if (meta) choose(meta);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
  }

  function avatar(meta: CurrencyMeta, hideOnMobile = false) {
    return (
      <span
        className={`${
          hideOnMobile ? "hidden sm:grid" : "grid"
        } h-7 w-9 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-semibold text-muted`}
      >
        {meta.symbol}
      </span>
    );
  }

  function renderItem(meta: CurrencyMeta, index: number) {
    const isActive = index === activeIndex;
    const isSelected = meta.code === value;
    return (
      <li key={meta.code} role="option" aria-selected={isSelected} data-index={index}>
        <button
          type="button"
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(meta)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            isSelected
              ? "bg-accent-soft text-accent-ink"
              : isActive
                ? "bg-surface-2 text-ink"
                : "text-ink"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {avatar(meta)}
            <span className="min-w-0 truncate">
              <span className="font-bold tracking-tight">{meta.code}</span>
              <span className="ml-2 text-muted">{currencyName(meta, lang)}</span>
            </span>
          </span>
          {isSelected && (
            <span className="shrink-0 text-accent">
              <Check />
            </span>
          )}
        </button>
      </li>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="field flex items-center justify-between gap-2 hover:bg-surface-2/60"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {avatar(selected, true)}
          <span className="min-w-0 truncate font-bold tracking-tight">{selected.code}</span>
        </span>
        <span className="text-muted">
          <Chevron open={open} />
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-2 w-[min(20rem,calc(100vw-2.5rem))] origin-top overflow-hidden rounded-2xl bg-surface shadow-lift ring-1 ring-line animate-sheetIn ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-muted transition-colors focus-within:border-accent focus-within:text-accent">
            <Magnifier />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("currency.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:font-semibold placeholder:text-muted/80"
            />
          </div>
          <ul
            id={`${id}-listbox`}
            ref={listRef}
            role="listbox"
            className="max-h-72 overflow-y-auto scroll-smooth p-1.5"
          >
            {options.length > 0 ? (
              options.map((meta, index) => renderItem(meta, index))
            ) : (
              <li className="px-3 py-8 text-center text-sm text-muted">{t("currency.noMatch")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

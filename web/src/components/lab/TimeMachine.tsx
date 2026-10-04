import Decimal from "decimal.js";
import { useEffect, useMemo, useState } from "react";
import type { UseAllHistoryResult } from "../../hooks/useAllHistory";
import { useConverter } from "../../hooks/useConverter";
import { useI18n } from "../../hooks/useI18n";
import { formatCompactRate } from "../../lib/convert";
import { CURRENCY_LIST, type CurrencyCode } from "../../lib/currencies";
import { errorKeyForCode } from "../../lib/errors";
import ErrorBanner from "../ErrorBanner";
import Skeleton from "../Skeleton";
import CrossTable from "./CrossTable";

const REF = "EUR";

export default function TimeMachine({ market }: { market: UseAllHistoryResult }) {
  const { from, to, setFrom, setTo, isFavorite } = useConverter();
  const { t } = useI18n();
  const dates = market.data?.dates ?? [];
  const series = market.data?.series ?? {};
  const count = dates.length;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (count > 0) setIndex(count - 1);
  }, [count]);

  useEffect(() => {
    if (!playing || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 450);
    return () => clearInterval(id);
  }, [playing, count]);

  const codes = useMemo(() => CURRENCY_LIST.map((meta) => meta.code), []);

  if (market.loading && !market.data) return <Skeleton lines={5} />;
  if (market.error && !market.data) {
    return <ErrorBanner message={t(errorKeyForCode(market.error))} onRetry={market.refresh} />;
  }

  function valueAt(code: CurrencyCode, idx: number): string | null {
    if (code === REF) return "1";
    return series[code]?.[idx] ?? null;
  }

  function rateAt(base: CurrencyCode, quote: CurrencyCode, idx: number): Decimal | null {
    const rBase = valueAt(base, idx);
    const rQuote = valueAt(quote, idx);
    if (rBase == null || rQuote == null) return null;
    return new Decimal(rQuote).div(rBase);
  }

  function rate(base: CurrencyCode, quote: CurrencyCode): string | null {
    const r = rateAt(base, quote, index);
    return r ? formatCompactRate(r) : null;
  }

  function heat(base: CurrencyCode, quote: CurrencyCode): number | null {
    if (index < 1) return null;
    const now = rateAt(base, quote, index);
    const prev = rateAt(base, quote, index - 1);
    if (!now || !prev) return null;
    return now.div(prev).toNumber() * 100 - 100;
  }

  return (
    <div>
      <p className="micro">{t("lab.tmHint")}</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="w-16 shrink-0 rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          {playing ? t("lab.pause") : t("lab.play")}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, count - 1)}
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
          className="h-1.5 flex-1 cursor-pointer rounded-full bg-surface-2"
          style={{ accentColor: "rgb(var(--accent))" }}
          aria-label={t("lab.date")}
        />
        <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted">
          {dates[index] ?? "—"}
        </span>
      </div>

      <CrossTable
        codes={codes}
        rate={rate}
        heat={heat}
        heatCap={1.5}
        starred={(base, quote) => isFavorite({ from: base, to: quote })}
        selected={{ from, to }}
        onPick={(base, quote) => {
          setFrom(base);
          setTo(quote);
        }}
        legend={{ down: t("matrix.down"), up: t("matrix.up") }}
      />
    </div>
  );
}

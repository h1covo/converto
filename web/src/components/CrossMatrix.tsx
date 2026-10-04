import Decimal from "decimal.js";
import { useMemo } from "react";
import { useAllHistory } from "../hooks/useAllHistory";
import { useAllRates } from "../hooks/useAllRates";
import { useConverter } from "../hooks/useConverter";
import { useI18n } from "../hooks/useI18n";
import { formatCompactRate } from "../lib/convert";
import { CURRENCY_LIST, type CurrencyCode } from "../lib/currencies";
import { seriesChange } from "../lib/stats";
import ErrorBanner from "./ErrorBanner";
import Skeleton from "./Skeleton";
import CrossTable from "./lab/CrossTable";

const REF = "EUR";
const HEAT_DAYS = 30;

export default function CrossMatrix() {
  const { from, to, setFrom, setTo, isFavorite } = useConverter();
  const { t } = useI18n();
  const rates = useAllRates(REF);
  const hist = useAllHistory(REF, HEAT_DAYS);

  const codes = useMemo(() => CURRENCY_LIST.map((meta) => meta.code), []);

  const eurRate = useMemo(() => {
    const map: Record<string, string> = { [REF]: "1" };
    if (rates.data) {
      for (const [code, rate] of Object.entries(rates.data.rates)) map[code] = rate;
    }
    return map;
  }, [rates.data]);

  const change = useMemo(() => {
    const map: Record<string, number> = { [REF]: 0 };
    if (hist.data) {
      for (const [code, series] of Object.entries(hist.data.series)) {
        const pct = seriesChange(series);
        if (pct != null) map[code] = pct / 100;
      }
    }
    return map;
  }, [hist.data]);

  function cellRate(base: CurrencyCode, quote: CurrencyCode): string | null {
    const rBase = eurRate[base];
    const rQuote = eurRate[quote];
    if (rBase == null || rQuote == null) return null;
    return formatCompactRate(new Decimal(rQuote).div(rBase));
  }

  function cellChange(base: CurrencyCode, quote: CurrencyCode): number | null {
    const cBase = change[base];
    const cQuote = change[quote];
    if (cBase == null || cQuote == null) return null;
    return ((1 + cQuote) / (1 + cBase) - 1) * 100;
  }

  function choose(base: CurrencyCode, quote: CurrencyCode) {
    setFrom(base);
    setTo(quote);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="panel panel-pad">
      <div className="section-head">
        <h2 className="section-title">{t("matrix.title")}</h2>
        <span className="pill">{HEAT_DAYS}D</span>
      </div>
      <p className="micro mt-1">{t("matrix.hint")}</p>

      {rates.loading && !rates.data ? (
        <div className="mt-4">
          <Skeleton lines={4} />
        </div>
      ) : rates.error && !rates.data ? (
        <div className="mt-4">
          <ErrorBanner message={rates.error} onRetry={rates.refresh} />
        </div>
      ) : (
        <CrossTable
          codes={codes}
          rate={cellRate}
          heat={cellChange}
          starred={(base, quote) => isFavorite({ from: base, to: quote })}
          selected={{ from, to }}
          onPick={choose}
          legend={{ down: t("matrix.down"), up: t("matrix.up") }}
        />
      )}
    </section>
  );
}

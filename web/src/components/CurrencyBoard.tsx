import { useAllHistory } from "../hooks/useAllHistory";
import { useAllRates } from "../hooks/useAllRates";
import { useConverter } from "../hooks/useConverter";
import { useI18n } from "../hooks/useI18n";
import { convert, formatAmount, parseAmount } from "../lib/convert";
import { CURRENCY_LIST, currencyName } from "../lib/currencies";
import { errorKeyForCode } from "../lib/errors";
import { seriesChange } from "../lib/stats";
import CopyButton from "./CopyButton";
import ErrorBanner from "./ErrorBanner";
import Skeleton from "./Skeleton";
import Sparkline from "./Sparkline";
import { StarButton } from "./Star";

const SPARK_DAYS = 30;

export default function CurrencyBoard() {
  const { from, to, amount, setTo, isFavorite, saveFavorite, removeFavorite } = useConverter();
  const { lang, t } = useI18n();
  const all = useAllRates(from);
  const hist = useAllHistory(from, SPARK_DAYS);
  const parse = parseAmount(amount);
  const rows = CURRENCY_LIST.filter((meta) => meta.code !== from);

  return (
    <section className="panel panel-pad">
      <div className="section-head">
        <h2 className="section-title">{t("board.title")}</h2>
        <span className="pill">
          {t("board.base")} · {from}
        </span>
      </div>

      {all.loading && !all.data ? (
        <div className="mt-4">
          <Skeleton lines={4} />
        </div>
      ) : all.error && !all.data ? (
        <div className="mt-4">
          <ErrorBanner message={t(errorKeyForCode(all.error))} onRetry={all.refresh} />
        </div>
      ) : all.data ? (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((meta) => {
            const rate = all.data!.rates[meta.code];
            let value = "—";
            if (parse.ok && rate != null) {
              value = formatAmount(convert(parse.value, rate), meta.decimals);
            }
            const filled = value !== "—";
            const isTarget = meta.code === to;
            const series = hist.data?.series?.[meta.code] ?? [];
            const changePct = seriesChange(series);
            const pair = { from, to: meta.code };
            const fav = isFavorite(pair);
            return (
              <li
                key={meta.code}
                className={`group relative flex flex-col rounded-xl border px-3 py-3 transition ${
                  isTarget
                    ? "border-accent/50 bg-accent-soft/60"
                    : "border-line bg-surface hover:border-accent/40 hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setTo(meta.code)}
                    aria-label={`${t("board.setTarget")} ${meta.code}`}
                    title={t("board.setTarget")}
                    className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg text-left outline-none"
                  >
                    <span className="grid h-7 w-9 shrink-0 place-items-center rounded-md bg-surface-2 text-xs font-semibold text-muted">
                      {meta.symbol}
                    </span>
                    <span className="truncate font-bold tracking-tight">{meta.code}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="tabular-nums font-semibold">{value}</span>
                    <StarButton
                      active={fav}
                      onToggle={() => (fav ? removeFavorite(pair) : saveFavorite(pair))}
                      label={fav ? t("fav.remove") : t("fav.add")}
                      className="h-7 w-7"
                    />
                  </div>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted">{currencyName(meta, lang)}</span>
                  {changePct != null && (
                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        changePct >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <Sparkline values={series} className="mt-2.5" />
                {filled && (
                  <CopyButton
                    text={`${value} ${meta.code}`}
                    label={t("board.copyAria")}
                    className="btn-icon absolute bottom-2 right-2.5 shadow-soft transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    ⧉
                  </CopyButton>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

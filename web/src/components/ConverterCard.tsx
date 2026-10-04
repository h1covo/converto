import { useEffect, useMemo, useRef } from "react";
import { useConverter } from "../hooks/useConverter";
import { useI18n } from "../hooks/useI18n";
import { useRate } from "../hooks/useRate";
import { convert, formatAmount, parseAmount, parseErrorKey } from "../lib/convert";
import { CURRENCIES } from "../lib/currencies";
import { errorKeyForCode } from "../lib/errors";
import AmountInput from "./AmountInput";
import CopyButton from "./CopyButton";
import CurrencySelect from "./CurrencySelect";
import QuickPairs from "./QuickPairs";
import RateInfo from "./RateInfo";
import { StarIcon } from "./Star";
import SwapButton from "./SwapButton";

export default function ConverterCard() {
  const { t } = useI18n();
  const {
    from,
    to,
    amount,
    setFrom,
    setTo,
    setAmount,
    swap,
    isFavorite,
    saveFavorite,
    removeFavorite,
    recordHistory,
  } = useConverter();
  const rate = useRate(from, to);

  const parse = useMemo(() => parseAmount(amount), [amount]);
  const errorKey = parse.ok ? null : parseErrorKey(parse.reason);
  const inputError = errorKey ? t(errorKey) : null;

  const resultText = useMemo(() => {
    if (!parse.ok || !rate.data) return null;
    return formatAmount(convert(parse.value, rate.data.rate), CURRENCIES[to].decimals);
  }, [parse, rate.data, to]);

  // 换算稳定 1.2s 后记入历史（去重，避免每击键记录）
  const lastRecorded = useRef("");
  const recordRef = useRef(recordHistory);
  recordRef.current = recordHistory;
  useEffect(() => {
    if (!parse.ok || !rate.data || amount.trim() === "") return;
    const key = `${from}|${to}|${amount}`;
    if (lastRecorded.current === key) return;
    const timer = setTimeout(() => {
      lastRecorded.current = key;
      recordRef.current({ from, to, amount, at: Date.now() });
    }, 1200);
    return () => clearTimeout(timer);
  }, [from, to, amount, rate.data, parse.ok]);

  const favorite = isFavorite({ from, to });

  return (
    <section className="card card-pad flex flex-col">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <CurrencySelect
            id="from"
            label={t("currency.from")}
            value={from}
            onChange={setFrom}
            align="left"
          />
        </div>
        <SwapButton onClick={swap} />
        <div className="min-w-0 flex-1">
          <CurrencySelect
            id="to"
            label={t("currency.to")}
            value={to}
            onChange={setTo}
            align="right"
          />
        </div>
      </div>

      <div className="mt-5">
        <AmountInput
          value={amount}
          symbol={CURRENCIES[from].symbol}
          error={inputError}
          onChange={setAmount}
        />
      </div>

      <div className="mt-5">
        <QuickPairs />
      </div>

      <div className="board board-texture mt-5 flex min-h-[9.5rem] flex-col justify-center overflow-hidden rounded-2xl p-6">
        {resultText !== null ? (
          <>
            <p className="text-sm font-medium text-board-muted">{t("result.title")}</p>
            <div className="mt-1.5 flex flex-wrap items-end gap-3">
              <p
                key={resultText}
                className="animate-valueIn break-all text-4xl font-extrabold leading-none tracking-tight text-board-ink sm:text-5xl"
              >
                {resultText}
                <span className="ml-2 align-baseline text-lg font-semibold text-board-accent">
                  {CURRENCIES[to].code}
                </span>
              </p>
              <CopyButton
                text={`${resultText} ${to}`}
                label={t("result.copy")}
                className="copy-on-board mb-1"
              >
                {t("result.copy")}
              </CopyButton>
            </div>
          </>
        ) : rate.loading ? (
          <div
            className="w-full animate-pulse space-y-3"
            role="status"
            aria-label={t("loading.rates")}
          >
            <div className="h-4 w-28 rounded bg-board-ink/15" />
            <div className="h-10 w-2/3 rounded bg-board-ink/15" />
          </div>
        ) : rate.error ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-board-ink/80">{t(errorKeyForCode(rate.error))}</p>
            <button type="button" onClick={rate.refresh} className="copy-on-board">
              {t("error.retry")}
            </button>
          </div>
        ) : (
          <p className="text-board-muted">
            {inputError ? t("result.fixAmount") : t("result.placeholder")}
          </p>
        )}
      </div>

      {rate.data && (
        <div className="mt-4">
          <RateInfo
            from={from}
            to={to}
            rate={rate.data.rate}
            date={rate.data.date}
            fetchedAt={rate.data.fetchedAt}
            stale={rate.stale}
            error={rate.error}
            onRetry={rate.refresh}
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={rate.refresh} className="btn btn-primary">
            <span aria-hidden="true" className="text-base leading-none">
              ↻
            </span>
            {t("rate.refresh")}
          </button>
          <button
            type="button"
            onClick={() => (favorite ? removeFavorite({ from, to }) : saveFavorite({ from, to }))}
            aria-label={favorite ? t("fav.remove") : t("fav.add")}
            aria-pressed={favorite}
            title={favorite ? t("fav.remove") : t("fav.add")}
            className={`btn ${
              favorite
                ? "border border-amber-300 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
                : "border border-line bg-surface px-4 py-3 text-muted hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-300"
            }`}
          >
            <span
              key={String(favorite)}
              aria-hidden="true"
              className={favorite ? "animate-pop text-amber-500" : ""}
            >
              <StarIcon filled={favorite} size={16} />
            </span>
            {favorite ? t("fav.saved") : t("fav.save")}
          </button>
        </div>
        <span className="text-xs text-muted">
          {rate.data ? (rate.data.cached ? t("rate.cached") : t("rate.fresh")) : ""}
        </span>
      </div>
    </section>
  );
}

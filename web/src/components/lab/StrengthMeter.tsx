import { useMemo } from "react";
import type { UseAllHistoryResult } from "../../hooks/useAllHistory";
import { useI18n } from "../../hooks/useI18n";
import { computeStrength } from "../../lib/analysis";
import { errorKeyForCode } from "../../lib/errors";
import ErrorBanner from "../ErrorBanner";
import Skeleton from "../Skeleton";

const WINDOW_POINTS = 22;

export default function StrengthMeter({ market }: { market: UseAllHistoryResult }) {
  const { t } = useI18n();
  const entries = useMemo(() => {
    if (!market.data) return [];
    const series = market.data.series;
    const length = Object.values(series)[0]?.length ?? 0;
    const withBase: Record<string, string[]> = { ...series };
    if (length > 0 && !withBase.EUR) withBase.EUR = Array(length).fill("1");
    return computeStrength(withBase, WINDOW_POINTS);
  }, [market.data]);

  if (market.loading && !market.data) {
    return <Skeleton lines={5} />;
  }
  if (market.error && !market.data) {
    return <ErrorBanner message={t(errorKeyForCode(market.error))} onRetry={market.refresh} />;
  }

  const maxAbs = Math.max(0.001, ...entries.map((entry) => Math.abs(entry.value)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="pill">{t("lab.window30")}</span>
        <span className="flex items-center gap-2 micro">
          {t("lab.weaker")}
          <span
            aria-hidden="true"
            className="legend-bar"
            style={{
              background:
                "linear-gradient(90deg, rgb(var(--down)) 0%, rgb(var(--surface-2)) 50%, rgb(var(--up)) 100%)",
            }}
          />
          {t("lab.stronger")}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {entries.map((entry) => {
          const up = entry.value >= 0;
          return (
            <div key={entry.code} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-xs font-semibold text-muted">{entry.code}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-surface-2">
                <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
                <span
                  className={`absolute top-0 h-full ${up ? "left-1/2 bg-up/70" : "right-1/2 bg-down/70"}`}
                  style={{ width: `${(Math.abs(entry.value) / maxAbs) * 50}%` }}
                />
              </div>
              <span
                className={`w-14 shrink-0 text-right text-xs font-medium tabular-nums ${
                  up ? "text-up" : "text-down"
                }`}
              >
                {up ? "+" : ""}
                {entry.value.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

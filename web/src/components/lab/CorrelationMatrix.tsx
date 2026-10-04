import { useMemo } from "react";
import type { UseAllHistoryResult } from "../../hooks/useAllHistory";
import { useI18n } from "../../hooks/useI18n";
import { computeCorrelationMatrix } from "../../lib/analysis";
import { errorKeyForCode } from "../../lib/errors";
import ErrorBanner from "../ErrorBanner";
import Skeleton from "../Skeleton";

const WINDOW_POINTS = 66;

function heat(value: number): string {
  const alpha = Math.min(0.55, Math.abs(value) * 0.55);
  if (alpha < 0.02) return "";
  const token = value >= 0 ? "--up" : "--down";
  return `rgb(var(${token}) / ${alpha.toFixed(3)})`;
}

export default function CorrelationMatrix({ market }: { market: UseAllHistoryResult }) {
  const { t } = useI18n();
  const result = useMemo(
    () => (market.data ? computeCorrelationMatrix(market.data.series, WINDOW_POINTS) : null),
    [market.data],
  );

  if (market.loading && !market.data) {
    return <Skeleton lines={5} />;
  }
  if (market.error && !market.data) {
    return <ErrorBanner message={t(errorKeyForCode(market.error))} onRetry={market.refresh} />;
  }
  if (!result) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="pill">{t("lab.window90")}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 micro">
          <span>{t("lab.corrHint")}</span>
          <span className="inline-flex items-center gap-1">
            <b className="font-semibold tabular-nums text-down">−1</b>
            <span>{t("lab.corrNegWord")}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <b className="font-semibold tabular-nums text-up">+1</b>
            <span>{t("lab.corrPosWord")}</span>
          </span>
        </span>
      </div>
      <div className="mt-3 max-h-[70vh] overflow-auto rounded-lg bg-surface ring-1 ring-line">
        <table className="border-separate border-spacing-0 text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-line bg-surface px-2 py-1.5" />
              {result.codes.map((code) => (
                <th
                  key={code}
                  className="sticky top-0 z-20 border-b border-line bg-surface px-2 py-1.5 text-right font-semibold text-muted"
                >
                  {code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.codes.map((row, i) => (
              <tr key={row}>
                <th className="sticky left-0 z-10 border-b border-r border-line bg-surface px-2 py-1 text-left font-semibold text-muted">
                  {row}
                </th>
                {result.codes.map((col, j) => {
                  const value = result.matrix[i][j];
                  return (
                    <td
                      key={col}
                      className="border-b border-line px-2 py-1.5 text-right tabular-nums"
                      style={{ backgroundColor: i === j ? undefined : heat(value) }}
                    >
                      {i === j ? <span className="text-muted/40">·</span> : value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>−1</span>
        <span
          aria-hidden="true"
          className="h-2 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgb(var(--down)) 0%, rgb(var(--surface-2)) 50%, rgb(var(--up)) 100%)",
          }}
        />
        <span>+1</span>
      </div>
    </div>
  );
}

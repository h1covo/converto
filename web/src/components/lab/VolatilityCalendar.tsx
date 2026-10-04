import { useMemo } from "react";
import type { UseHistoryResult } from "../../hooks/useHistory";
import { useI18n } from "../../hooks/useI18n";
import { computeWeeklyVolatility } from "../../lib/analysis";
import { errorKeyForCode } from "../../lib/errors";
import ErrorBanner from "../ErrorBanner";
import Skeleton from "../Skeleton";

export default function VolatilityCalendar({ pair }: { pair: UseHistoryResult }) {
  const { t } = useI18n();
  const weeks = useMemo(
    () => (pair.data ? computeWeeklyVolatility(pair.data.points) : []),
    [pair.data],
  );

  if (pair.loading && !pair.data) {
    return <Skeleton lines={4} />;
  }
  if (pair.error && !pair.data) {
    return <ErrorBanner message={t(errorKeyForCode(pair.error))} onRetry={pair.refresh} />;
  }

  const max = Math.max(0.001, ...weeks.map((week) => week.volatility));

  return (
    <div>
      <p className="micro">{t("lab.volHint")}</p>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(1.05rem,1fr))] gap-1">
        {weeks.map((week) => {
          const intensity = week.volatility / max;
          return (
            <div
              key={week.index}
              title={`${week.date} · ${week.volatility.toFixed(2)}%`}
              className="aspect-square rounded-[3px]"
              style={{ backgroundColor: `rgb(var(--accent) / ${(0.08 + intensity * 0.72).toFixed(3)})` }}
            />
          );
        })}
      </div>
    </div>
  );
}

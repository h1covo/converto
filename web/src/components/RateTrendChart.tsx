import { useMemo, useRef, useState, type MouseEvent } from "react";
import { useConverter } from "../hooks/useConverter";
import { useHistory } from "../hooks/useHistory";
import { useI18n } from "../hooks/useI18n";
import { formatRate } from "../lib/convert";
import { errorKeyForCode } from "../lib/errors";
import { buildTrendGeometry, nearestIndex } from "../lib/trend";
import ErrorBanner from "./ErrorBanner";

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = 14;

const RANGES: Array<{
  days: number;
  key: "trend.range.7" | "trend.range.30" | "trend.range.90" | "trend.range.365";
}> = [
  { days: 7, key: "trend.range.7" },
  { days: 30, key: "trend.range.30" },
  { days: 90, key: "trend.range.90" },
  { days: 365, key: "trend.range.365" },
];

function shortDate(date: string): string {
  return date.length >= 10 ? date.slice(5) : date;
}

export default function RateTrendChart() {
  const { from, to, days, setDays } = useConverter();
  const { t } = useI18n();
  const { data, loading, stale, error, refresh } = useHistory(from, to, days);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const points = data?.points ?? [];
  const geometry = useMemo(() => buildTrendGeometry(points, WIDTH, HEIGHT, PADDING), [points]);

  const up = geometry.changePct >= 0;
  const fillId = `trend-fill-${from}-${to}`;
  const active = hover != null ? geometry.coords[hover] : undefined;
  const minCoord = geometry.coords.find((coord) => coord.rate === geometry.min);
  const maxCoord = geometry.coords.find((coord) => coord.rate === geometry.max);

  function handleMove(event: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || geometry.coords.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    setHover(nearestIndex(geometry.coords, x));
  }

  const hasData = points.length > 0;

  return (
    <section className="card card-pad flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="section-title">{t("trend.title")}</h2>
          {stale && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
              {t("trend.stale")}
            </span>
          )}
        </div>
        <div className="seg" role="tablist" aria-label={t("trend.title")}>
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              role="tab"
              aria-selected={days === range.days}
              onClick={() => setDays(range.days)}
              className={`seg-item ${days === range.days ? "seg-item--on" : ""}`}
            >
              {t(range.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <span>
          {t("trend.high")}{" "}
          <span className="font-semibold text-ink">
            {hasData ? formatRate(geometry.max) : "—"}
          </span>
        </span>
        <span>
          {t("trend.low")}{" "}
          <span className="font-semibold text-ink">
            {hasData ? formatRate(geometry.min) : "—"}
          </span>
        </span>
        <span>
          {t("trend.change")}{" "}
          <span className={`font-semibold ${up ? "text-up" : "text-down"}`}>
            {hasData ? `${up ? "+" : ""}${geometry.changePct.toFixed(2)}%` : "—"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-center">
        {loading && !data ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface-2" />
        ) : error && !data ? (
          <ErrorBanner message={t(errorKeyForCode(error))} onRetry={refresh} />
        ) : !hasData ? (
          <p className="py-16 text-center text-muted">{t("trend.empty")}</p>
        ) : (
          <>
            <div className={`relative ${up ? "text-up" : "text-down"}`}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full"
                role="img"
                aria-label={`${from} → ${to}`}
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
              >
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path d={geometry.areaPath} fill={`url(#${fillId})`} />
                <path
                  d={geometry.linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {maxCoord && <circle cx={maxCoord.x} cy={maxCoord.y} r="3" fill="currentColor" />}
                {minCoord && <circle cx={minCoord.x} cy={minCoord.y} r="3" fill="currentColor" />}

                {active && (
                  <>
                    <line
                      x1={active.x}
                      y1={PADDING}
                      x2={active.x}
                      y2={HEIGHT - PADDING}
                      stroke="currentColor"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={active.x}
                      cy={active.y}
                      r="4.5"
                      fill="rgb(var(--surface))"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                  </>
                )}
              </svg>

              {active && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-paper shadow-lift"
                  style={{
                    left: `${(active.x / WIDTH) * 100}%`,
                    top: `${(active.y / HEIGHT) * 100}%`,
                  }}
                >
                  <div className="font-semibold">{shortDate(active.date)}</div>
                  <div className="opacity-80">
                    1 {from} = {formatRate(active.rate)} {to}
                  </div>
                </div>
              )}

              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{shortDate(data!.startDate)}</span>
                <span>{shortDate(data!.endDate)}</span>
              </div>
            </div>

            {error && (
              <button
                type="button"
                onClick={refresh}
                className="mt-3 text-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                {t("trend.retry")}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

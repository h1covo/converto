import { useConverter } from "../hooks/useConverter";
import { useHistory } from "../hooks/useHistory";
import { useI18n } from "../hooks/useI18n";
import { formatRate } from "../lib/convert";
import { computeFxStats } from "../lib/stats";
import Skeleton from "./Skeleton";

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted">—</span>;
  const up = value >= 0;
  return (
    <span className={`font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}>
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down" | "none";
}

function StatRow({ label, value, sub, tone = "none" }: StatRowProps) {
  const toneClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "";
  return (
    <div className="stat">
      <dt className="micro">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold tabular-nums ${toneClass}`}>
        {value}
        {sub && <span className="ml-1.5 text-xs font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}

export default function MarketStats({ className = "" }: { className?: string }) {
  const { from, to } = useConverter();
  const { t } = useI18n();
  const { data, loading } = useHistory(from, to, 365);
  const stats = data ? computeFxStats(data.points) : null;

  return (
    <section className={`panel panel-pad ${className}`}>
      <div className="section-head">
        <h2 className="section-title">{t("stats.title")}</h2>
        <span className="pill">{t("stats.range")}</span>
      </div>

      {loading && !stats ? (
        <div className="mt-4">
          <Skeleton lines={3} />
        </div>
      ) : !stats ? (
        <p className="mt-3 text-sm text-muted">—</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="stat">
              <div className="micro">{t("stats.day")}</div>
              <div className="mt-1 text-sm">
                <Change value={stats.change1d} />
              </div>
            </div>
            <div className="stat">
              <div className="micro">{t("stats.week")}</div>
              <div className="mt-1 text-sm">
                <Change value={stats.change1w} />
              </div>
            </div>
            <div className="stat">
              <div className="micro">{t("stats.month")}</div>
              <div className="mt-1 text-sm">
                <Change value={stats.change1m} />
              </div>
            </div>
            <div className="stat">
              <div className="micro">{t("stats.year")}</div>
              <div className="mt-1 text-sm">
                <Change value={stats.change1y} />
              </div>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            {stats.high && (
              <StatRow
                label={t("stats.high52")}
                value={formatRate(stats.high.rate)}
                sub={stats.high.date.slice(5)}
              />
            )}
            {stats.low && (
              <StatRow
                label={t("stats.low52")}
                value={formatRate(stats.low.rate)}
                sub={stats.low.date.slice(5)}
              />
            )}
          </dl>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            <StatRow
              label={t("stats.vol")}
              value={stats.volatility != null ? `${stats.volatility.toFixed(2)}%` : "—"}
            />
            <StatRow
              label={t("stats.vsMean")}
              value={
                stats.devFromMean30 != null
                  ? `${stats.devFromMean30 >= 0 ? "+" : ""}${stats.devFromMean30.toFixed(2)}%`
                  : "—"
              }
              tone={
                stats.devFromMean30 == null
                  ? "none"
                  : stats.devFromMean30 >= 0
                    ? "up"
                    : "down"
              }
            />
          </dl>
        </>
      )}
    </section>
  );
}

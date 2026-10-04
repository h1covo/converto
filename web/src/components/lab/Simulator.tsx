import Decimal from "decimal.js";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { UseHistoryResult } from "../../hooks/useHistory";
import { useConverter } from "../../hooks/useConverter";
import { useI18n } from "../../hooks/useI18n";
import { simulateConversion } from "../../lib/analysis";
import { formatAmount, formatRate, parseAmount } from "../../lib/convert";
import type { CurrencyCode } from "../../lib/currencies";
import { errorKeyForCode } from "../../lib/errors";
import { buildTrendGeometry, nearestIndex } from "../../lib/trend";
import ErrorBanner from "../ErrorBanner";
import Skeleton from "../Skeleton";

const W = 640;
const H = 200;
const P = 14;

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const toneClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "";
  return (
    <div className="stat">
      <div className="micro">{label}</div>
      <div className={`mt-1 text-sm font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

interface SimulatorProps {
  pair: UseHistoryResult;
  from: CurrencyCode;
  to: CurrencyCode;
}

export default function Simulator({ pair, from, to }: SimulatorProps) {
  const { t } = useI18n();
  const { amount } = useConverter();
  const points = pair.data?.points ?? [];
  const count = points.length;
  const rates = useMemo(() => points.map((point) => Number(point.rate)), [points]);
  const geometry = useMemo(() => buildTrendGeometry(points, W, H, P), [points]);

  const [buy, setBuy] = useState(0);
  const [sell, setSell] = useState(0);
  useEffect(() => {
    setBuy(0);
    setSell(Math.max(0, count - 1));
  }, [count]);

  const buyRef = useRef(buy);
  buyRef.current = buy;
  const sellRef = useRef(sell);
  sellRef.current = sell;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef<null | "buy" | "sell">(null);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const which = dragging.current;
      const svg = svgRef.current;
      if (!which || !svg || geometry.coords.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * W;
      const index = nearestIndex(geometry.coords, x);
      if (which === "buy") setBuy(Math.min(index, sellRef.current));
      else setSell(Math.max(index, buyRef.current));
    }
    function onUp() {
      dragging.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [geometry]);

  if (pair.loading && !pair.data) return <Skeleton lines={4} />;
  if (pair.error && !pair.data) {
    return <ErrorBanner message={t(errorKeyForCode(pair.error))} onRetry={pair.refresh} />;
  }
  if (count < 2 || geometry.coords.length < 2) return <p className="text-sm text-muted">—</p>;

  const parsed = parseAmount(amount);
  const invest = parsed.ok ? Number(parsed.value.toString()) : 1000;
  const result = simulateConversion(rates, invest, buy, sell);
  const coords = geometry.coords;
  const xBuy = coords[buy]?.x ?? P;
  const xSell = coords[sell]?.x ?? W - P;
  const up = geometry.changePct >= 0;
  const stroke = up ? "rgb(var(--up))" : "rgb(var(--down))";

  function start(which: "buy" | "sell") {
    return (event: ReactPointerEvent) => {
      event.preventDefault();
      dragging.current = which;
    };
  }

  return (
    <div>
      <p className="micro">{t("lab.simHint")}</p>
      <div className="mt-3">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${from} → ${to}`}>
          <defs>
            <linearGradient id="sim-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={geometry.areaPath} fill="url(#sim-area)" />
          <rect
            x={Math.min(xBuy, xSell)}
            y={P}
            width={Math.abs(xSell - xBuy)}
            height={H - 2 * P}
            fill="rgb(var(--accent) / 0.10)"
          />
          <path
            d={geometry.linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line x1={xBuy} y1={P} x2={xBuy} y2={H - P} stroke="rgb(var(--accent))" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={xSell} y1={P} x2={xSell} y2={H - P} stroke="rgb(var(--accent))" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle
            cx={xBuy}
            cy={coords[buy]?.y ?? H / 2}
            r="6"
            fill="rgb(var(--surface))"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            onPointerDown={start("buy")}
            style={{ cursor: "ew-resize", touchAction: "none" }}
          />
          <circle
            cx={xSell}
            cy={coords[sell]?.y ?? H / 2}
            r="6"
            fill="rgb(var(--surface))"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            onPointerDown={start("sell")}
            style={{ cursor: "ew-resize", touchAction: "none" }}
          />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("lab.simInvest")} value={`${invest.toLocaleString()} ${from}`} />
        <Stat
          label={t("lab.simBuy")}
          value={`${formatRate(rates[buy])} · ${points[buy]?.date.slice(5)}`}
        />
        <Stat
          label={t("lab.simSell")}
          value={`${formatRate(rates[sell])} · ${points[sell]?.date.slice(5)}`}
        />
        <Stat
          label={t("lab.simFinal")}
          value={result ? `${formatAmount(new Decimal(result.finalValue), 2)} ${from}` : "—"}
          tone={result ? (result.pnlPct >= 0 ? "up" : "down") : undefined}
        />
      </div>

      <p className="mt-2 text-sm text-muted">
        {t("lab.simPnl")}:{" "}
        <span className={`font-semibold ${result && result.pnlPct >= 0 ? "text-up" : "text-down"}`}>
          {result ? `${result.pnlPct >= 0 ? "+" : ""}${result.pnlPct.toFixed(2)}%` : "—"}
        </span>
      </p>
    </div>
  );
}

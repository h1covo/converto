import type { CSSProperties } from "react";
import type { CurrencyCode } from "../../lib/currencies";
import { StarIcon } from "../Star";

export interface CrossTableProps {
  codes: CurrencyCode[];
  rate: (base: CurrencyCode, quote: CurrencyCode) => string | null;
  heat?: (base: CurrencyCode, quote: CurrencyCode) => number | null;
  starred?: (base: CurrencyCode, quote: CurrencyCode) => boolean;
  selected: { from: CurrencyCode; to: CurrencyCode };
  onPick: (base: CurrencyCode, quote: CurrencyCode) => void;
  heatCap?: number;
  legend?: { down: string; up: string };
}

function heatStyle(value: number | null, cap: number): CSSProperties {
  if (value == null) return {};
  const normalized = Math.max(-1, Math.min(1, value / cap));
  const alpha = Math.min(0.5, Math.abs(normalized) * 0.5);
  if (alpha < 0.02) return {};
  const token = normalized >= 0 ? "--up" : "--down";
  return { backgroundColor: `rgb(var(${token}) / ${alpha.toFixed(3)})` };
}

export default function CrossTable({
  codes,
  rate,
  heat,
  starred,
  selected,
  onPick,
  heatCap = 2,
  legend,
}: CrossTableProps) {
  return (
    <>
      <div className="mt-4 max-h-[70vh] overflow-auto rounded-lg bg-surface ring-1 ring-line">
        <table className="border-separate border-spacing-0 text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-line bg-surface px-2 py-1.5" />
              {codes.map((code) => (
                <th
                  key={code}
                  className={`sticky top-0 z-20 border-b border-line bg-surface px-2 py-1.5 text-right font-semibold ${
                    code === selected.to ? "text-accent" : code === selected.from ? "text-ink" : "text-muted"
                  }`}
                >
                  {code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map((base) => (
              <tr key={base}>
                <th
                  className={`sticky left-0 z-10 border-b border-r border-line bg-surface px-2 py-1 text-left font-semibold ${
                    base === selected.from ? "text-accent" : "text-muted"
                  }`}
                >
                  {base}
                </th>
                {codes.map((quote) => {
                  if (base === quote) {
                    return (
                      <td key={quote} className="border-b border-line px-2 py-1.5 text-center text-muted/40">
                        ·
                      </td>
                    );
                  }
                  const value = rate(base, quote);
                  const isSel = base === selected.from && quote === selected.to;
                  const mark = starred?.(base, quote);
                  return (
                    <td key={quote} className="border-b border-line p-0">
                      <button
                        type="button"
                        onClick={() => onPick(base, quote)}
                        style={heatStyle(heat ? heat(base, quote) : null, heatCap)}
                        title={`1 ${base} = ${value ?? "—"} ${quote}`}
                        className={`relative block h-full w-full min-w-[3.5rem] px-2 py-1.5 text-right tabular-nums outline-none transition hover:bg-accent/10 ${
                          isSel ? "ring-2 ring-inset ring-accent" : ""
                        }`}
                      >
                        {value ?? "—"}
                        {mark && (
                          <span aria-hidden="true" className="absolute left-0.5 top-0.5 text-amber-500">
                            <StarIcon filled size={9} />
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legend && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span>{legend.down}</span>
          <span
            aria-hidden="true"
            className="h-2 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgb(var(--down)) 0%, rgb(var(--surface-2)) 50%, rgb(var(--up)) 100%)",
            }}
          />
          <span>{legend.up}</span>
        </div>
      )}
    </>
  );
}

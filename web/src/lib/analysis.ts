import type { SeriesPoint } from "./stats";

export interface StrengthEntry {
  code: string;
  /** 相对其它所有币的平均涨跌幅（百分数），正=强于平均 */
  value: number;
}

/**
 * 各币种相对其它所有币的平均强弱。
 * series 为各币对同一公共基准的汇率序列；先算各币在该窗口的收益率，再对
 * 币对 (i→j) 的涨跌 (1+r_i)/(1+r_j)-1 取所有 j≠i 的平均。
 */
export function computeStrength(
  series: Record<string, string[]>,
  points = 22,
): StrengthEntry[] {
  const codes = Object.keys(series).filter((code) => series[code].length > points);
  const returns: Record<string, number> = {};
  for (const code of codes) {
    const arr = series[code];
    const last = Number(arr[arr.length - 1]);
    const base = Number(arr[arr.length - 1 - points]);
    if (base) returns[code] = last / base - 1;
  }

  return codes
    .map((i) => {
      let sum = 0;
      let n = 0;
      for (const j of codes) {
        if (j === i || returns[i] == null || returns[j] == null) continue;
        sum += (1 + returns[i]) / (1 + returns[j]) - 1;
        n++;
      }
      return { code: i, value: n ? (sum / n) * 100 : 0 };
    })
    .sort((a, b) => b.value - a.value);
}

/** 日收益率序列。 */
export function dailyReturns(series: Array<string | number>): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = Number(series[i - 1]);
    if (prev) out.push(Number(series[i]) / prev - 1);
  }
  return out;
}

/** 皮尔逊相关系数。 */
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  if (va === 0 || vb === 0) return 0;
  return cov / Math.sqrt(va * vb);
}

export interface CorrelationResult {
  codes: string[];
  matrix: number[][];
}

/** 两两相关性矩阵（基于日收益，取最后 points 个）。 */
export function computeCorrelationMatrix(
  series: Record<string, string[]>,
  points = 66,
): CorrelationResult {
  const codes = Object.keys(series);
  const returns: Record<string, number[]> = {};
  for (const code of codes) {
    returns[code] = dailyReturns(series[code]).slice(-points);
  }
  const matrix = codes.map((i) =>
    codes.map((j) => (i === j ? 1 : pearson(returns[i], returns[j]))),
  );
  return { codes, matrix };
}

export interface WeekVol {
  index: number;
  /** 该周周一日期 */
  date: string;
  volatility: number;
}

function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/** 按自然周分桶的年化波动率（百分数）。 */
export function computeWeeklyVolatility(points: SeriesPoint[]): WeekVol[] {
  const buckets = new Map<string, number[]>();
  const order: string[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = Number(points[i - 1].rate);
    const cur = Number(points[i].rate);
    if (!prev) continue;
    const key = weekStart(points[i].date);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(cur / prev - 1);
  }
  return order.map((date, index) => {
    const rs = buckets.get(date)!;
    const mean = rs.reduce((sum, value) => sum + value, 0) / rs.length;
    const variance = rs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rs.length;
    return { index, date, volatility: Math.sqrt(variance) * Math.sqrt(252) * 100 };
  });
}

export interface SimResult {
  buyRate: number;
  sellRate: number;
  finalValue: number;
  pnlPct: number;
}

/**
 * 模拟换算：在 buyIndex 把 amount（源币）换成目标币，sellIndex 再换回源币。
 * 两个时点必须不同且在范围内。
 */
export function simulateConversion(
  rates: number[],
  amount: number,
  buyIndex: number,
  sellIndex: number,
): SimResult | null {
  if (buyIndex === sellIndex) return null;
  if (buyIndex < 0 || sellIndex < 0) return null;
  if (buyIndex >= rates.length || sellIndex >= rates.length) return null;
  const buyRate = rates[buyIndex];
  const sellRate = rates[sellIndex];
  if (!buyRate || !sellRate) return null;
  const finalValue = (amount * buyRate) / sellRate;
  return { buyRate, sellRate, finalValue, pnlPct: (finalValue / amount - 1) * 100 };
}

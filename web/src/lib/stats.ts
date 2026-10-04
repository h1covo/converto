export interface SeriesPoint {
  date: string;
  rate: string;
}

export interface StatExtreme {
  rate: number;
  date: string;
}

export interface FxStats {
  points: number;
  latest: number;
  change1d: number | null;
  change1w: number | null;
  change1m: number | null;
  change1y: number | null;
  high: StatExtreme | null;
  low: StatExtreme | null;
  mean30: number | null;
  devFromMean30: number | null;
  volatility: number | null;
}

const DAY_MS = 86_400_000;

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** 系列两端涨跌幅（百分数）：(last / first - 1) * 100；不足两点返回 null。 */
export function seriesChange(series: Array<string | number>): number | null {
  if (series.length < 2) return null;
  const first = Number(series[0]);
  const last = Number(series[series.length - 1]);
  if (!first) return null;
  return (last / first - 1) * 100;
}

/** 相对 N 个自然日前的涨跌幅（百分数）；找不到更早的点返回 null。 */
export function changeOverDays(points: SeriesPoint[], days: number): number | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  const target = toTime(latest.date) - days * DAY_MS;
  let base: SeriesPoint | null = null;
  for (let i = points.length - 1; i >= 0; i--) {
    if (toTime(points[i].date) <= target) {
      base = points[i];
      break;
    }
  }
  if (!base) return null;
  const baseValue = Number(base.rate);
  if (!baseValue) return null;
  return (Number(latest.rate) / baseValue - 1) * 100;
}

/** 由时间序列计算区间涨跌、52 周高低、均价偏离与年化波动率（纯函数）。 */
export function computeFxStats(points: SeriesPoint[]): FxStats | null {
  if (points.length < 2) return null;

  const values = points.map((point) => Number(point.rate));
  const latest = values[values.length - 1];

  let highIndex = 0;
  let lowIndex = 0;
  values.forEach((value, index) => {
    if (value > values[highIndex]) highIndex = index;
    if (value < values[lowIndex]) lowIndex = index;
  });

  const last30 = values.slice(-30);
  const mean30 = last30.reduce((sum, value) => sum + value, 0) / last30.length;

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1]) returns.push(values[i] / values[i - 1] - 1);
  }
  let volatility: number | null = null;
  if (returns.length > 1) {
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
    volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  return {
    points: points.length,
    latest,
    change1d: changeOverDays(points, 1),
    change1w: changeOverDays(points, 7),
    change1m: changeOverDays(points, 30),
    // 365 天窗口通常无法回溯到整整一年前，回退为「序列首尾涨跌」
    change1y: changeOverDays(points, 365) ?? seriesChange(values),
    high: { rate: values[highIndex], date: points[highIndex].date },
    low: { rate: values[lowIndex], date: points[lowIndex].date },
    mean30,
    devFromMean30: mean30 ? (latest / mean30 - 1) * 100 : null,
    volatility,
  };
}

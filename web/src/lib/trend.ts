export interface TrendPoint {
  date: string;
  rate: string;
}

export interface TrendCoord {
  x: number;
  y: number;
  date: string;
  rate: number;
}

export interface TrendGeometry {
  coords: TrendCoord[];
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
  first: number;
  last: number;
  /** 区间涨跌幅（百分比）；首值为 0 时按 0 处理 */
  changePct: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 把时间序列映射到 viewBox 坐标，产出折线/面积路径与统计值。
 * 纯函数，与渲染无关，便于单测。y 轴向下，故数值越大 y 越小。
 */
export function buildTrendGeometry(
  points: TrendPoint[],
  width: number,
  height: number,
  padding = 12,
): TrendGeometry {
  const values = points.map((point) => ({ date: point.date, rate: Number(point.rate) }));
  const rates = values.map((value) => value.rate);
  const min = rates.length ? Math.min(...rates) : 0;
  const max = rates.length ? Math.max(...rates) : 0;
  const first = rates.length ? rates[0] : 0;
  const last = rates.length ? rates[rates.length - 1] : 0;
  const changePct = first === 0 ? 0 : ((last - first) / first) * 100;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const span = max - min;
  const count = values.length;

  const coords: TrendCoord[] = values.map((value, index) => {
    const x =
      count <= 1 ? padding + innerW / 2 : padding + (index * innerW) / (count - 1);
    const y =
      span === 0
        ? padding + innerH / 2
        : padding + innerH - ((value.rate - min) / span) * innerH;
    return { x: round(x), y: round(y), date: value.date, rate: value.rate };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`)
    .join(" ");

  let areaPath = "";
  if (coords.length > 0) {
    const baseY = round(height - padding);
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    areaPath = `${linePath} L${lastX} ${baseY} L${firstX} ${baseY} Z`;
  }

  return { coords, linePath, areaPath, min, max, first, last, changePct };
}

/** 悬浮定位：返回距离 x 最近的坐标点下标。 */
export function nearestIndex(coords: TrendCoord[], x: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < coords.length; index++) {
    const distance = Math.abs(coords[index].x - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

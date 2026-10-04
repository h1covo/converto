import { describe, expect, it } from "vitest";
import { changeOverDays, computeFxStats, seriesChange, type SeriesPoint } from "./stats";

function daily(startDate: string, rates: number[]): SeriesPoint[] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  return rates.map((rate, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    rate: String(rate),
  }));
}

describe("changeOverDays", () => {
  const points = daily("2026-01-01", [10, 11, 12, 13, 14, 15, 16, 17]);

  it("按自然日回溯计算涨跌幅", () => {
    expect(changeOverDays(points, 1)).toBeCloseTo((17 / 16 - 1) * 100);
    expect(changeOverDays(points, 7)).toBeCloseTo((17 / 10 - 1) * 100);
  });

  it("回溯超出范围返回 null", () => {
    expect(changeOverDays(points, 365)).toBeNull();
  });

  it("不足两点返回 null", () => {
    expect(changeOverDays(points.slice(0, 1), 1)).toBeNull();
  });
});

describe("seriesChange", () => {
  it("两端涨跌", () => {
    expect(seriesChange(["7", "7.7"])).toBeCloseTo(10);
    expect(seriesChange(["7"])).toBeNull();
    expect(seriesChange(["0", "7"])).toBeNull();
  });
});

describe("computeFxStats", () => {
  const points = daily("2026-01-01", [7.0, 7.1, 6.9, 7.4, 7.2, 7.05]);
  const stats = computeFxStats(points)!;

  it("最新值与涨跌", () => {
    expect(stats.latest).toBeCloseTo(7.05);
    expect(stats.change1d).toBeCloseTo((7.05 / 7.2 - 1) * 100);
  });

  it("最高/最低及日期", () => {
    expect(stats.high!.rate).toBeCloseTo(7.4);
    expect(stats.high!.date).toBe("2026-01-04");
    expect(stats.low!.rate).toBeCloseTo(6.9);
    expect(stats.low!.date).toBe("2026-01-03");
  });

  it("30 日均值与偏离", () => {
    expect(stats.mean30).toBeCloseTo(7.108333, 4);
    expect(stats.devFromMean30).toBeCloseTo((7.05 / stats.mean30! - 1) * 100);
  });

  it("波动率为有限数且过大序列稳定", () => {
    expect(stats.volatility).not.toBeNull();
    expect(Number.isFinite(stats.volatility!)).toBe(true);
  });

  it("不足两点返回 null", () => {
    expect(computeFxStats(points.slice(0, 1))).toBeNull();
    expect(computeFxStats([])).toBeNull();
  });
});

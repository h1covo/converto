import { describe, expect, it } from "vitest";
import {
  computeCorrelationMatrix,
  computeStrength,
  computeWeeklyVolatility,
  dailyReturns,
  pearson,
  simulateConversion,
} from "./analysis";
import type { SeriesPoint } from "./stats";

describe("dailyReturns", () => {
  it("计算日收益", () => {
    const r = dailyReturns(["100", "110", "99"]);
    expect(r[0]).toBeCloseTo(0.1);
    expect(r[1]).toBeCloseTo(-0.1);
  });
  it("忽略前置 0 的异常", () => {
    expect(dailyReturns(["0", "5"])).toEqual([]);
  });
});

describe("pearson", () => {
  it("完全正/负相关", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
  });
  it("常数序列返回 0", () => {
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
  });
});

describe("computeStrength", () => {
  it("升值更多的币更强，且排序正确", () => {
    const series = {
      AAA: ["1", "1.1", "1.2"], // +20%
      BBB: ["1", "1.0", "1.0"], // 0%
      CCC: ["1", "0.95", "0.9"], // -10%
    };
    const result = computeStrength(series, 2);
    expect(result[0].code).toBe("AAA");
    expect(result[result.length - 1].code).toBe("CCC");
    expect(result[0].value).toBeGreaterThan(0);
    expect(result[result.length - 1].value).toBeLessThan(0);
  });
});

describe("computeCorrelationMatrix", () => {
  it("对角为 1，对称，同步序列接近 1", () => {
    const series = {
      AAA: ["1", "1.01", "1.02", "1.03", "1.04"],
      BBB: ["1", "1.02", "1.04", "1.06", "1.08"],
    };
    const { codes, matrix } = computeCorrelationMatrix(series, 4);
    expect(codes).toEqual(["AAA", "BBB"]);
    expect(matrix[0][0]).toBe(1);
    expect(matrix[0][1]).toBeCloseTo(1);
    expect(matrix[1][0]).toBeCloseTo(matrix[0][1]);
  });
});

describe("computeWeeklyVolatility", () => {
  it("按周分桶并给出有限波动率", () => {
    const points: SeriesPoint[] = [];
    let d = Date.parse("2026-01-05T00:00:00Z"); // Monday
    let rate = 7;
    for (let i = 0; i < 10; i++) {
      points.push({ date: new Date(d).toISOString().slice(0, 10), rate: String(rate) });
      rate += i % 2 === 0 ? 0.05 : -0.04;
      d += 86400000;
    }
    const weeks = computeWeeklyVolatility(points);
    expect(weeks.length).toBeGreaterThanOrEqual(2);
    for (const week of weeks) expect(Number.isFinite(week.volatility)).toBe(true);
  });
});

describe("simulateConversion", () => {
  it("低买高卖（对源币而言汇率升则亏）", () => {
    const rates = [7, 7.5, 8];
    const r = simulateConversion(rates, 1000, 0, 2)!;
    expect(r.buyRate).toBe(7);
    expect(r.sellRate).toBe(8);
    expect(r.finalValue).toBeCloseTo((1000 * 7) / 8);
    expect(r.pnlPct).toBeLessThan(0);
  });
  it("时点相同或越界返回 null", () => {
    expect(simulateConversion([7, 8], 1000, 1, 1)).toBeNull();
    expect(simulateConversion([7, 8], 1000, 0, 5)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildTrendGeometry, nearestIndex, type TrendPoint } from "./trend";

const points: TrendPoint[] = [
  { date: "2026-09-28", rate: "6.7105" },
  { date: "2026-09-29", rate: "6.7034" },
  { date: "2026-10-02", rate: "6.7046" },
];

describe("buildTrendGeometry", () => {
  it("统计 min/max/first/last 与涨跌幅", () => {
    const geometry = buildTrendGeometry(points, 640, 220, 14);
    expect(geometry.min).toBeCloseTo(6.7034);
    expect(geometry.max).toBeCloseTo(6.7105);
    expect(geometry.first).toBeCloseTo(6.7105);
    expect(geometry.last).toBeCloseTo(6.7046);
    expect(geometry.changePct).toBeLessThan(0);
  });

  it("折线/面积路径存在且坐标落在内边距范围内", () => {
    const geometry = buildTrendGeometry(points, 640, 220, 14);
    expect(geometry.linePath.startsWith("M")).toBe(true);
    expect(geometry.areaPath.endsWith("Z")).toBe(true);
    for (const coord of geometry.coords) {
      expect(coord.x).toBeGreaterThanOrEqual(14);
      expect(coord.x).toBeLessThanOrEqual(640 - 14);
      expect(coord.y).toBeGreaterThanOrEqual(14);
      expect(coord.y).toBeLessThanOrEqual(220 - 14);
    }
  });

  it("数值最大点在上方（y 较小），最小点在下方", () => {
    const geometry = buildTrendGeometry(points, 640, 220, 14);
    const maxCoord = geometry.coords.find((coord) => coord.date === "2026-09-28");
    const minCoord = geometry.coords.find((coord) => coord.date === "2026-09-29");
    expect(maxCoord!.y).toBeLessThan(minCoord!.y);
  });

  it("平线（min==max）不除零，落在垂直居中", () => {
    const flat: TrendPoint[] = [
      { date: "2026-01-01", rate: "1" },
      { date: "2026-01-02", rate: "1" },
    ];
    const geometry = buildTrendGeometry(flat, 640, 220, 14);
    expect(geometry.changePct).toBe(0);
    for (const coord of geometry.coords) {
      expect(coord.y).toBeCloseTo(110);
    }
  });

  it("单点居中", () => {
    const single: TrendPoint[] = [{ date: "2026-01-01", rate: "7" }];
    const geometry = buildTrendGeometry(single, 640, 220, 14);
    expect(geometry.coords).toHaveLength(1);
    expect(geometry.coords[0].x).toBeCloseTo(320);
    expect(geometry.coords[0].y).toBeCloseTo(110);
  });

  it("空序列不报错，产出空几何", () => {
    const geometry = buildTrendGeometry([], 640, 220, 14);
    expect(geometry.coords).toHaveLength(0);
    expect(geometry.linePath).toBe("");
    expect(geometry.areaPath).toBe("");
    expect(geometry.changePct).toBe(0);
  });

  it("涨跌幅为正时 sign 正确", () => {
    const rising: TrendPoint[] = [
      { date: "a", rate: "7" },
      { date: "b", rate: "7.7" },
    ];
    expect(buildTrendGeometry(rising, 100, 100, 10).changePct).toBeCloseTo(10);
  });
});

describe("nearestIndex", () => {
  it("命中最近的坐标点", () => {
    const { coords } = buildTrendGeometry(points, 640, 220, 14);
    const target = coords[1];
    expect(nearestIndex(coords, target.x + 1)).toBe(1);
    expect(nearestIndex(coords, -100)).toBe(0);
    expect(nearestIndex(coords, 9999)).toBe(coords.length - 1);
  });
});

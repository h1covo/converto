import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { HistoryFetcher } from "../src/services/frankfurter.js";
import type { RateCache } from "../src/services/rateCache.js";
import type { TtlCache } from "../src/services/ttlCache.js";
import type { HistoryPoint } from "../src/types.js";

const noopRateCache: RateCache = {
  get: async () => ({
    quote: { rate: "1", date: "2026-10-02", fetchedAt: 0 },
    cached: false,
    stale: false,
  }),
};

/** 直接执行 loader 的透传缓存，便于测试路由本身。 */
function passthrough(stale = false): TtlCache<HistoryPoint[]> {
  return {
    get: async (_key, loader) => ({
      value: await loader(),
      fetchedAt: 123,
      cached: stale,
      stale,
    }),
  };
}

const samplePoints: HistoryPoint[] = [
  { date: "2026-09-28", rate: "6.7105" },
  { date: "2026-09-29", rate: "6.7034" },
  { date: "2026-10-02", rate: "6.7046" },
];

function appWith(fetcher: HistoryFetcher, stale = false) {
  return createApp({
    cache: noopRateCache,
    historyCache: passthrough(stale),
    historyFetcher: fetcher,
  });
}

describe("GET /api/rates/history", () => {
  it("不支持的币种 → 400", async () => {
    const res = await request(appWith(async () => samplePoints)).get(
      "/api/rates/history?from=USD&to=BTC",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_CURRENCY");
  });

  it("非法时间范围 → 400 INVALID_RANGE", async () => {
    const res = await request(appWith(async () => samplePoints)).get(
      "/api/rates/history?from=USD&to=CNY&days=15",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_RANGE");
  });

  it("缺省 days=30，成功返回序列与 latest", async () => {
    const res = await request(appWith(async () => samplePoints)).get(
      "/api/rates/history?from=USD&to=CNY",
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      base: "USD",
      quote: "CNY",
      days: 30,
      latest: "6.7046",
      cached: false,
      stale: false,
      fetchedAt: 123,
    });
    expect(res.body.points).toHaveLength(3);
    expect(res.body.points[0].rate).toBe("6.7105");
    expect(typeof res.body.startDate).toBe("string");
  });

  it("同币种 → 工作日平线，且不调用上游", async () => {
    const fetcher = vi.fn<HistoryFetcher>(async () => samplePoints);
    const res = await request(appWith(fetcher)).get(
      "/api/rates/history?from=JPY&to=JPY&days=7",
    );
    expect(res.status).toBe(200);
    expect(fetcher).not.toHaveBeenCalled();
    expect(res.body.latest).toBe("1");
    expect(res.body.points.length).toBeGreaterThan(0);
    for (const point of res.body.points as HistoryPoint[]) {
      expect(point.rate).toBe("1");
    }
  });

  it("stale 透传", async () => {
    const res = await request(appWith(async () => samplePoints, true)).get(
      "/api/rates/history?from=USD&to=CNY&days=90",
    );
    expect(res.status).toBe(200);
    expect(res.body.stale).toBe(true);
  });

  it("上游失败且无缓存 → 502", async () => {
    const res = await request(
      appWith(async () => {
        throw new Error("upstream down");
      }),
    ).get("/api/rates/history?from=USD&to=CNY");
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_UNAVAILABLE");
  });
});

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AllHistoryFetcher } from "../src/services/frankfurter.js";
import type { RateCache } from "../src/services/rateCache.js";
import type { TtlCache } from "../src/services/ttlCache.js";
import type { HistoryAllData } from "../src/types.js";

const noopRateCache: RateCache = {
  get: async () => ({
    quote: { rate: "1", date: "2026-10-02", fetchedAt: 0 },
    cached: false,
    stale: false,
  }),
};

function passthrough(stale = false): TtlCache<HistoryAllData> {
  return {
    get: async (_key, loader) => ({
      value: await loader(),
      fetchedAt: 5,
      cached: stale,
      stale,
    }),
  };
}

const data: HistoryAllData = {
  dates: ["2026-09-30", "2026-10-01", "2026-10-02"],
  series: {
    CNY: ["6.71", "6.70", "6.70"],
    EUR: ["0.89", "0.88", "0.89"],
  },
};

function appWith(fetcher: AllHistoryFetcher, stale = false) {
  return createApp({
    cache: noopRateCache,
    allHistoryCache: passthrough(stale),
    allHistoryFetcher: fetcher,
  });
}

describe("GET /api/rates/history/all", () => {
  it("不支持的基准币 → 400", async () => {
    const res = await request(appWith(async () => data)).get(
      "/api/rates/history/all?from=BTC",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_CURRENCY");
  });

  it("非法时间范围 → 400 INVALID_RANGE", async () => {
    const res = await request(appWith(async () => data)).get(
      "/api/rates/history/all?from=USD&days=15",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_RANGE");
  });

  it("成功返回全表序列", async () => {
    const res = await request(appWith(async () => data)).get(
      "/api/rates/history/all?from=USD&days=30",
    );
    expect(res.status).toBe(200);
    expect(res.body.base).toBe("USD");
    expect(res.body.days).toBe(30);
    expect(res.body.series.CNY).toEqual(["6.71", "6.70", "6.70"]);
    expect(res.body.fetchedAt).toBe(5);
    expect(typeof res.body.startDate).toBe("string");
  });

  it("缺省 days=30", async () => {
    const res = await request(appWith(async () => data)).get(
      "/api/rates/history/all?from=USD",
    );
    expect(res.body.days).toBe(30);
  });

  it("stale 透传", async () => {
    const res = await request(appWith(async () => data, true)).get(
      "/api/rates/history/all?from=USD",
    );
    expect(res.body.stale).toBe(true);
  });

  it("上游失败且无缓存 → 502", async () => {
    const res = await request(
      appWith(async () => {
        throw new Error("down");
      }),
    ).get("/api/rates/history/all?from=USD");
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_UNAVAILABLE");
  });
});

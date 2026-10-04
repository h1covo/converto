import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AllRatesFetcher } from "../src/services/frankfurter.js";
import type { RateCache } from "../src/services/rateCache.js";
import type { TtlCache } from "../src/services/ttlCache.js";
import type { RatesTable } from "../src/types.js";

const noopRateCache: RateCache = {
  get: async () => ({
    quote: { rate: "1", date: "2026-10-02", fetchedAt: 0 },
    cached: false,
    stale: false,
  }),
};

function passthrough(stale = false): TtlCache<RatesTable> {
  return {
    get: async (_key, loader) => ({
      value: await loader(),
      fetchedAt: 7,
      cached: stale,
      stale,
    }),
  };
}

const table: RatesTable = {
  date: "2026-10-02",
  rates: { CNY: 6.7046, EUR: 0.89, JPY: 157.67, BTC: 123, AUD: 1.5 },
};

function appWith(fetcher: AllRatesFetcher, stale = false) {
  return createApp({
    cache: noopRateCache,
    allRatesCache: passthrough(stale),
    allRatesFetcher: fetcher,
  });
}

describe("GET /api/rates/all", () => {
  it("不支持的基准币 → 400", async () => {
    const res = await request(appWith(async () => table)).get("/api/rates/all?from=BTC");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_CURRENCY");
  });

  it("成功返回受支持、非基准的币种（字符串）", async () => {
    const res = await request(appWith(async () => table)).get("/api/rates/all?from=USD");
    expect(res.status).toBe(200);
    expect(res.body.base).toBe("USD");
    expect(res.body.date).toBe("2026-10-02");
    expect(res.body.rates.CNY).toBe("6.7046");
    expect(res.body.rates.AUD).toBe("1.5");
    expect(res.body.rates.USD).toBeUndefined();
    expect(res.body.rates.BTC).toBeUndefined();
    expect(res.body.fetchedAt).toBe(7);
  });

  it("缺省基准币为 USD", async () => {
    const res = await request(appWith(async () => table)).get("/api/rates/all");
    expect(res.status).toBe(200);
    expect(res.body.base).toBe("USD");
  });

  it("stale 透传", async () => {
    const res = await request(appWith(async () => table, true)).get("/api/rates/all?from=USD");
    expect(res.body.stale).toBe(true);
  });

  it("上游失败且无缓存 → 502", async () => {
    const res = await request(
      appWith(async () => {
        throw new Error("down");
      }),
    ).get("/api/rates/all?from=USD");
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_UNAVAILABLE");
  });
});

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { RateCache } from "../src/services/rateCache.js";

function stubCache(impl: RateCache["get"]): RateCache {
  return { get: impl };
}

describe("GET /api/rates", () => {
  it("不支持的币种 → 400", async () => {
    const app = createApp({ cache: stubCache(async () => ({ quote: { rate: "1", date: "d", fetchedAt: 0 }, cached: false, stale: false })) });
    const res = await request(app).get("/api/rates?from=USD&to=BTC");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_CURRENCY");
  });

  it("缺少参数 → 400", async () => {
    const app = createApp({ cache: stubCache(async () => ({ quote: { rate: "1", date: "d", fetchedAt: 0 }, cached: false, stale: false })) });
    const res = await request(app).get("/api/rates");
    expect(res.status).toBe(400);
  });

  it("同币种 → rate 恒为 1，不请求上游", async () => {
    let called = false;
    const app = createApp({
      cache: stubCache(async () => {
        called = true;
        return { quote: { rate: "1", date: "d", fetchedAt: 0 }, cached: false, stale: false };
      }),
    });
    const res = await request(app).get("/api/rates?from=USD&to=usd");
    expect(res.status).toBe(200);
    expect(res.body.rate).toBe("1");
    expect(called).toBe(false);
  });

  it("成功 → 返回字符串汇率与元数据", async () => {
    const app = createApp({
      cache: stubCache(async () => ({
        quote: { rate: "6.7046", date: "2026-10-02", fetchedAt: 123 },
        cached: false,
        stale: false,
      })),
    });
    const res = await request(app).get("/api/rates?from=USD&to=CNY");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      base: "USD",
      quote: "CNY",
      rate: "6.7046",
      date: "2026-10-02",
      fetchedAt: 123,
      cached: false,
      stale: false,
    });
    expect(typeof res.body.rate).toBe("string");
  });

  it("上游返回 stale → 透传标记", async () => {
    const app = createApp({
      cache: stubCache(async () => ({
        quote: { rate: "6.7", date: "2026-10-02", fetchedAt: 1 },
        cached: true,
        stale: true,
      })),
    });
    const res = await request(app).get("/api/rates?from=USD&to=CNY");
    expect(res.status).toBe(200);
    expect(res.body.stale).toBe(true);
  });

  it("上游失败且无缓存 → 502", async () => {
    const app = createApp({
      cache: stubCache(async () => {
        throw new Error("upstream down");
      }),
    });
    const res = await request(app).get("/api/rates?from=USD&to=CNY");
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_UNAVAILABLE");
  });
});

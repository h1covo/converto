import { describe, expect, it } from "vitest";
import type { UpstreamFetcher } from "../src/services/frankfurter.js";
import { createRateCache } from "../src/services/rateCache.js";

describe("rateCache", () => {
  it("首次未命中 → 取上游；TTL 内命中 → 用缓存", async () => {
    let t = 0;
    let calls = 0;
    const fetcher: UpstreamFetcher = async () => {
      calls++;
      return { rate: "7.1", date: "2026-10-02" };
    };
    const cache = createRateCache(1000, fetcher, () => t);

    const first = await cache.get("USD", "CNY");
    expect(calls).toBe(1);
    expect(first.cached).toBe(false);
    expect(first.stale).toBe(false);
    expect(first.quote.rate).toBe("7.1");

    t = 500;
    const second = await cache.get("USD", "CNY");
    expect(calls).toBe(1);
    expect(second.cached).toBe(true);
    expect(second.stale).toBe(false);
  });

  it("TTL 过期 → 重新取上游", async () => {
    let t = 0;
    let calls = 0;
    const fetcher: UpstreamFetcher = async () => {
      calls++;
      return { rate: `${calls}`, date: "2026-10-02" };
    };
    const cache = createRateCache(1000, fetcher, () => t);

    await cache.get("USD", "CNY");
    t = 1500;
    const refreshed = await cache.get("USD", "CNY");
    expect(calls).toBe(2);
    expect(refreshed.cached).toBe(false);
    expect(refreshed.quote.rate).toBe("2");
  });

  it("上游失败但有旧值 → 返回旧值并标记 stale", async () => {
    let t = 0;
    let mode: "ok" | "fail" = "ok";
    const fetcher: UpstreamFetcher = async () => {
      if (mode === "fail") throw new Error("boom");
      return { rate: "7", date: "2026-10-02" };
    };
    const cache = createRateCache(1000, fetcher, () => t);

    await cache.get("USD", "CNY");
    mode = "fail";
    t = 2000;
    const result = await cache.get("USD", "CNY");
    expect(result.stale).toBe(true);
    expect(result.cached).toBe(true);
    expect(result.quote.rate).toBe("7");
  });

  it("上游失败且无缓存 → 抛错", async () => {
    const fetcher: UpstreamFetcher = async () => {
      throw new Error("boom");
    };
    const cache = createRateCache(1000, fetcher);
    await expect(cache.get("USD", "CNY")).rejects.toThrow("boom");
  });

  it("同一 key 的并发请求合并为一次上游调用", async () => {
    let calls = 0;
    let resolve!: (v: { rate: string; date: string }) => void;
    const fetcher: UpstreamFetcher = () =>
      new Promise((res) => {
        calls++;
        resolve = res;
      });
    const cache = createRateCache(1000, fetcher);

    const p1 = cache.get("USD", "CNY");
    const p2 = cache.get("USD", "CNY");
    resolve({ rate: "1", date: "2026-10-02" });
    await Promise.all([p1, p2]);
    expect(calls).toBe(1);
  });
});

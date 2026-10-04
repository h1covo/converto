import { describe, expect, it } from "vitest";
import { createTtlCache } from "../src/services/ttlCache.js";

describe("createTtlCache", () => {
  it("首次未命中 → 调用 loader；TTL 内 → 命中缓存", async () => {
    let t = 0;
    let calls = 0;
    const cache = createTtlCache<number>(1000, () => t);

    const first = await cache.get("k", async () => ++calls);
    expect(first.value).toBe(1);
    expect(first.cached).toBe(false);
    expect(first.stale).toBe(false);

    t = 500;
    const second = await cache.get("k", async () => ++calls);
    expect(second.value).toBe(1);
    expect(second.cached).toBe(true);
    expect(calls).toBe(1);
  });

  it("过期后重新调用 loader", async () => {
    let t = 0;
    let calls = 0;
    const cache = createTtlCache<number>(1000, () => t);

    await cache.get("k", async () => ++calls);
    t = 1500;
    const refreshed = await cache.get("k", async () => ++calls);
    expect(refreshed.value).toBe(2);
    expect(refreshed.cached).toBe(false);
  });

  it("loader 失败但有旧值 → 返回旧值并标记 stale", async () => {
    let t = 0;
    const cache = createTtlCache<string>(1000, () => t);
    await cache.get("k", async () => "old");

    t = 2000;
    const result = await cache.get("k", async () => {
      throw new Error("boom");
    });
    expect(result.value).toBe("old");
    expect(result.stale).toBe(true);
    expect(result.cached).toBe(true);
  });

  it("loader 失败且无旧值 → 抛错", async () => {
    const cache = createTtlCache<string>(1000);
    await expect(
      cache.get("k", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("同一 key 的并发调用合并为一次 loader", async () => {
    let calls = 0;
    let resolve!: (v: number) => void;
    const cache = createTtlCache<number>(1000);

    const loader = () =>
      new Promise<number>((res) => {
        calls++;
        resolve = res;
      });
    const p1 = cache.get("k", loader);
    const p2 = cache.get("k", loader);
    resolve(42);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(calls).toBe(1);
    expect(r1.value).toBe(42);
    expect(r2.value).toBe(42);
  });
});

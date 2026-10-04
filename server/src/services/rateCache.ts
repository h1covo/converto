import type { UpstreamQuote } from "../types.js";
import type { UpstreamFetcher } from "./frankfurter.js";
import { createTtlCache } from "./ttlCache.js";

export interface CachedQuote extends UpstreamQuote {
  fetchedAt: number;
}

export interface CacheLookup {
  quote: CachedQuote;
  cached: boolean;
  stale: boolean;
}

export interface RateCache {
  get(from: string, to: string): Promise<CacheLookup>;
}

/** 汇率缓存：在通用 TTL 缓存之上按 `from|to` 组装 CachedQuote。 */
export function createRateCache(
  ttlMs: number,
  fetcher: UpstreamFetcher,
  now: () => number = Date.now,
): RateCache {
  const cache = createTtlCache<UpstreamQuote>(ttlMs, now);

  return {
    async get(from, to) {
      const { value, fetchedAt, cached, stale } = await cache.get(`${from}|${to}`, () =>
        fetcher(from, to),
      );
      return { quote: { ...value, fetchedAt }, cached, stale };
    },
  };
}

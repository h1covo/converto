export interface TtlEntry<V> {
  value: V;
  fetchedAt: number;
}

export interface TtlResult<V> {
  value: V;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

export interface TtlCache<V> {
  get(key: string, loader: () => Promise<V>): Promise<TtlResult<V>>;
}

/**
 * 通用内存 TTL 缓存：
 * - 命中且未过期 → 直接返回；
 * - 过期/未命中 → 调用 loader（同一 key 的并发调用合并为一次）；
 * - loader 失败但有旧值 → 返回旧值并标记 stale。
 */
export function createTtlCache<V>(ttlMs: number, now: () => number = Date.now): TtlCache<V> {
  const store = new Map<string, TtlEntry<V>>();
  const inflight = new Map<string, Promise<V>>();

  function loadOnce(key: string, loader: () => Promise<V>): Promise<V> {
    const existing = inflight.get(key);
    if (existing) return existing;
    const promise = loader().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  }

  return {
    async get(key, loader) {
      const hit = store.get(key);
      const timestamp = now();
      if (hit && timestamp - hit.fetchedAt < ttlMs) {
        return { value: hit.value, fetchedAt: hit.fetchedAt, cached: true, stale: false };
      }
      try {
        const value = await loadOnce(key, loader);
        const entry: TtlEntry<V> = { value, fetchedAt: now() };
        store.set(key, entry);
        return { value, fetchedAt: entry.fetchedAt, cached: false, stale: false };
      } catch (err) {
        if (hit) {
          return { value: hit.value, fetchedAt: hit.fetchedAt, cached: true, stale: true };
        }
        throw err;
      }
    },
  };
}

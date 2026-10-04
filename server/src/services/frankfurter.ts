import { SUPPORTED_CURRENCIES } from "../currencies.js";
import type { Config, HistoryAllData, HistoryPoint, RatesTable, UpstreamQuote } from "../types.js";

/** 可替换的上游取数函数，便于测试注入假实现。 */
export type UpstreamFetcher = (
  from: string,
  to: string,
  signal?: AbortSignal,
) => Promise<UpstreamQuote>;

/**
 * 带超时的 fetch；失败重试 `retries` 次。
 * 外部 signal（如请求被取消）会立即中止内部请求。
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  retries: number,
  outerSignal?: AbortSignal,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();
    outerSignal?.addEventListener("abort", onOuterAbort, { once: true });
    try {
      return await fetch(url, { signal: controller.signal });
    } catch (err) {
      lastError = err;
      if (outerSignal?.aborted) throw err;
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }
  throw lastError ?? new Error("upstream request failed");
}

/** 基于 Frankfurter 的上游取数实现（无需 API Key）。 */
export function createFrankfurterFetcher(cfg: Config): UpstreamFetcher {
  return async (from, to, signal) => {
    const url =
      `${cfg.upstreamBaseUrl}/latest?from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}`;
    const res = await fetchWithTimeout(url, cfg.upstreamTimeoutMs, 1, signal);
    if (!res.ok) {
      throw new Error(`upstream responded ${res.status}`);
    }
    const data = (await res.json()) as {
      base: string;
      date: string;
      rates?: Record<string, number>;
    };
    const rate = data.rates?.[to];
    if (rate == null) {
      throw new Error(`upstream missing rate for ${to}`);
    }
    return { rate: String(rate), date: data.date };
  };
}

/** 全表取数函数（一次拿到基准币对全部币种的汇率），便于测试注入。 */
export type AllRatesFetcher = (from: string, signal?: AbortSignal) => Promise<RatesTable>;

/** Frankfurter：/latest?from=USD（不带 to）返回该基准币对全部币种的汇率。 */
export function createFrankfurterAllRatesFetcher(cfg: Config): AllRatesFetcher {
  return async (from, signal) => {
    const url = `${cfg.upstreamBaseUrl}/latest?from=${encodeURIComponent(from)}`;
    const res = await fetchWithTimeout(url, cfg.upstreamTimeoutMs, 1, signal);
    if (!res.ok) {
      throw new Error(`upstream responded ${res.status}`);
    }
    const data = (await res.json()) as {
      date: string;
      rates?: Record<string, number>;
    };
    return { date: data.date, rates: data.rates ?? {} };
  };
}

/** 全表时间序列取数函数，便于测试注入。 */
export type AllHistoryFetcher = (
  from: string,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
) => Promise<HistoryAllData>;

/**
 * Frankfurter 时间序列（不带 to）：/{start}..{end}?from=USD 一次返回该基准币对全部币种。
 * 归一化为 code → 汇率字符串数组（仅受支持、非基准、且有序的币种）。
 */
export function createFrankfurterAllHistoryFetcher(cfg: Config): AllHistoryFetcher {
  return async (from, startDate, endDate, signal) => {
    const url =
      `${cfg.upstreamBaseUrl}/${startDate}..${endDate}` +
      `?from=${encodeURIComponent(from)}`;
    const res = await fetchWithTimeout(url, cfg.upstreamTimeoutMs, 1, signal);
    if (!res.ok) {
      throw new Error(`upstream responded ${res.status}`);
    }
    const data = (await res.json()) as {
      rates?: Record<string, Record<string, number>>;
    };
    const dates = Object.keys(data.rates ?? {}).sort();
    const series: HistoryAllData["series"] = {};
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === from) continue;
      const values: string[] = [];
      for (const date of dates) {
        const value = data.rates?.[date]?.[code];
        if (value != null) values.push(String(value));
      }
      if (values.length > 0) series[code] = values;
    }
    return { dates, series };
  };
}

/** 时间序列取数函数，便于测试注入。 */
export type HistoryFetcher = (
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
) => Promise<HistoryPoint[]>;

/**
 * Frankfurter 时间序列：/{start}..{end}?from=&to=
 * 仅返回交易日（周末/假日缺省），结果按日期升序。
 */
export function createFrankfurterHistoryFetcher(cfg: Config): HistoryFetcher {
  return async (from, to, startDate, endDate, signal) => {
    const url =
      `${cfg.upstreamBaseUrl}/${startDate}..${endDate}` +
      `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetchWithTimeout(url, cfg.upstreamTimeoutMs, 1, signal);
    if (!res.ok) {
      throw new Error(`upstream responded ${res.status}`);
    }
    const data = (await res.json()) as {
      rates?: Record<string, Record<string, number>>;
    };
    const points: HistoryPoint[] = [];
    for (const [date, map] of Object.entries(data.rates ?? {})) {
      const value = map[to];
      if (value == null) continue;
      points.push({ date, rate: String(value) });
    }
    points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return points;
  };
}

import { CURRENCY_LIST } from "../lib/currencies";
import { RateError } from "./client";
import type { HistoryAllResponse, HistoryPoint, HistoryResponse } from "./history";
import type { AllRatesResponse, RateResponse } from "./rates";

/**
 * Frankfurter 公共 API（CORS `*`，无需 Key）。静态部署时前端直连。
 * 注意：旧域名 `api.frankfurter.app` 会 301 跳到 `.dev` 且跳转响应无 CORS 头，
 * 浏览器会报 MissingAllowOriginHeader —— 必须直接用新域名 `.dev/v1`。
 */
const BASE_URL = "https://api.frankfurter.dev/v1";

const SUPPORTED = new Set<string>(CURRENCY_LIST.map((meta) => meta.code));
const ALLOWED_DAYS = new Set([7, 30, 90, 365]);

const SPOT_TTL = 5 * 60 * 1000;
const HISTORY_TTL = 60 * 60 * 1000;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 生成 [start, end] 内的工作日（周一至周五）日期，用于同币种平线。 */
function weekdaysBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) out.push(isoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new RateError("NETWORK");
  }
  if (!res.ok) {
    if (res.status === 404 || res.status === 400 || res.status === 422) {
      throw new RateError("UNSUPPORTED_CURRENCY");
    }
    throw new RateError("UPSTREAM_UNAVAILABLE");
  }
  return (await res.json()) as T;
}

interface CacheEntry {
  value: unknown;
  fetchedAt: number;
}

const memory = new Map<string, CacheEntry>();

/** 会话内 TTL 缓存；命中即秒回，失败时回退到过期数据并标记 stale（对齐服务端语义）。 */
async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; fetchedAt: number; cached: boolean; stale: boolean }> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && now - hit.fetchedAt < ttlMs) {
    return { value: hit.value as T, fetchedAt: hit.fetchedAt, cached: true, stale: false };
  }
  try {
    const value = await loader();
    memory.set(key, { value, fetchedAt: now });
    return { value, fetchedAt: now, cached: false, stale: false };
  } catch (err) {
    if (hit) {
      return { value: hit.value as T, fetchedAt: hit.fetchedAt, cached: true, stale: true };
    }
    throw err;
  }
}

function assertCurrency(code: string): void {
  if (!SUPPORTED.has(code)) throw new RateError("UNSUPPORTED_CURRENCY");
}

function assertDays(days: number): void {
  if (!ALLOWED_DAYS.has(days)) throw new RateError("INVALID_RANGE");
}

type SeriesMap = Record<string, Record<string, number>>;

export function fetchRateStatic(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<RateResponse> {
  const base = from.toUpperCase();
  const quote = to.toUpperCase();
  assertCurrency(base);
  assertCurrency(quote);
  if (base === quote) {
    return Promise.resolve({
      base,
      quote,
      rate: "1",
      date: isoDate(new Date()),
      fetchedAt: Date.now(),
      cached: true,
      stale: false,
    });
  }
  const url = `${BASE_URL}/latest?from=${base}&to=${quote}`;
  return cached(`rate|${base}|${quote}`, SPOT_TTL, async () => {
    const data = await getJson<{ date: string; rates?: Record<string, number> }>(url, signal);
    const rate = data.rates?.[quote];
    if (rate == null) throw new RateError("UPSTREAM_UNAVAILABLE");
    return { rate: String(rate), date: data.date };
  }).then(({ value, fetchedAt, cached: isCached, stale }) => ({
    base,
    quote,
    rate: value.rate,
    date: value.date,
    fetchedAt,
    cached: isCached,
    stale,
  }));
}

export function fetchAllRatesStatic(
  from: string,
  signal?: AbortSignal,
): Promise<AllRatesResponse> {
  const base = from.toUpperCase();
  assertCurrency(base);
  const url = `${BASE_URL}/latest?from=${base}`;
  return cached(`all|${base}`, SPOT_TTL, async () => {
    const data = await getJson<{ date: string; rates?: Record<string, number> }>(url, signal);
    const rates: Record<string, string> = {};
    for (const meta of CURRENCY_LIST) {
      if (meta.code === base) continue;
      const rate = data.rates?.[meta.code];
      if (rate != null) rates[meta.code] = String(rate);
    }
    return { date: data.date, rates };
  }).then(({ value, fetchedAt, cached: isCached, stale }) => ({
    base,
    date: value.date,
    rates: value.rates,
    fetchedAt,
    cached: isCached,
    stale,
  }));
}

export function fetchHistoryStatic(
  from: string,
  to: string,
  days: number,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const base = from.toUpperCase();
  const quote = to.toUpperCase();
  assertCurrency(base);
  assertCurrency(quote);
  assertDays(days);

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const startDate = isoDate(start);
  const endDate = isoDate(end);

  if (base === quote) {
    const points: HistoryPoint[] = weekdaysBetween(start, end).map((date) => ({
      date,
      rate: "1",
    }));
    return Promise.resolve({
      base,
      quote,
      days,
      startDate,
      endDate,
      points,
      latest: "1",
      fetchedAt: Date.now(),
      cached: true,
      stale: false,
    });
  }

  const url = `${BASE_URL}/${startDate}..${endDate}?from=${base}&to=${quote}`;
  return cached(`history|${base}|${quote}|${days}`, HISTORY_TTL, async () => {
    const data = await getJson<{ rates?: SeriesMap }>(url, signal);
    const points: HistoryPoint[] = [];
    for (const [date, map] of Object.entries(data.rates ?? {})) {
      const value = map[quote];
      if (value != null) points.push({ date, rate: String(value) });
    }
    points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return points;
  }).then(({ value: points, fetchedAt, cached: isCached, stale }) => ({
    base,
    quote,
    days,
    startDate,
    endDate,
    points,
    latest: points.length ? points[points.length - 1].rate : null,
    fetchedAt,
    cached: isCached,
    stale,
  }));
}

export function fetchAllHistoryStatic(
  from: string,
  days: number,
  signal?: AbortSignal,
): Promise<HistoryAllResponse> {
  const base = from.toUpperCase();
  assertCurrency(base);
  assertDays(days);

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const startDate = isoDate(start);
  const endDate = isoDate(end);

  const url = `${BASE_URL}/${startDate}..${endDate}?from=${base}`;
  return cached(`historyall|${base}|${days}`, HISTORY_TTL, async () => {
    const data = await getJson<{ rates?: SeriesMap }>(url, signal);
    const dates = Object.keys(data.rates ?? {}).sort();
    const series: Record<string, string[]> = {};
    for (const meta of CURRENCY_LIST) {
      if (meta.code === base) continue;
      const values: string[] = [];
      for (const date of dates) {
        const value = data.rates?.[date]?.[meta.code];
        if (value != null) values.push(String(value));
      }
      if (values.length > 0) series[meta.code] = values;
    }
    return { dates, series };
  }).then(({ value, fetchedAt, cached: isCached, stale }) => ({
    base,
    days,
    startDate,
    endDate,
    dates: value.dates,
    series: value.series,
    fetchedAt,
    cached: isCached,
    stale,
  }));
}

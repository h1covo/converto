import type { CurrencyCode } from "../lib/currencies";
import { requestJson } from "./client";
import { STATIC_MODE } from "./mode";
import { fetchAllHistoryStatic, fetchHistoryStatic } from "./static";

export interface HistoryPoint {
  date: string;
  rate: string;
}

export interface HistoryResponse {
  base: string;
  quote: string;
  days: number;
  startDate: string;
  endDate: string;
  points: HistoryPoint[];
  latest: string | null;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

export interface HistoryAllResponse {
  base: string;
  days: number;
  startDate: string;
  endDate: string;
  dates: string[];
  series: Record<string, string[]>;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

/** 取基准币对全部币种的时间序列（一次请求）。 */
export function fetchAllHistory(
  from: CurrencyCode | string,
  days: number,
  signal?: AbortSignal,
): Promise<HistoryAllResponse> {
  if (STATIC_MODE) return fetchAllHistoryStatic(from, days, signal);
  const url =
    `/api/rates/history/all?from=${encodeURIComponent(from)}&days=${days}`;
  return requestJson<HistoryAllResponse>(url, signal);
}

/** 通过中转层取汇率时间序列。 */
export function fetchHistory(
  from: CurrencyCode | string,
  to: CurrencyCode | string,
  days: number,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  if (STATIC_MODE) return fetchHistoryStatic(from, to, days, signal);
  const url =
    `/api/rates/history?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}&days=${days}`;
  return requestJson<HistoryResponse>(url, signal);
}

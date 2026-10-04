import type { CurrencyCode } from "../lib/currencies";
import { requestJson } from "./client";
import { STATIC_MODE } from "./mode";
import { fetchAllRatesStatic, fetchRateStatic } from "./static";

export { RateError } from "./client";
export type { RateErrorCode } from "./client";

export interface RateResponse {
  base: string;
  quote: string;
  rate: string;
  date: string;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

export interface AllRatesResponse {
  base: string;
  date: string;
  rates: Record<string, string>;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

/** 通过自建中转层取单币对汇率。 */
export function fetchRate(
  from: CurrencyCode | string,
  to: CurrencyCode | string,
  signal?: AbortSignal,
): Promise<RateResponse> {
  if (STATIC_MODE) return fetchRateStatic(from, to, signal);
  const url = `/api/rates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  return requestJson<RateResponse>(url, signal);
}

/** 取某基准币对全部币种的全表汇率（一次请求）。 */
export function fetchAllRates(
  from: CurrencyCode | string,
  signal?: AbortSignal,
): Promise<AllRatesResponse> {
  if (STATIC_MODE) return fetchAllRatesStatic(from, signal);
  const url = `/api/rates/all?from=${encodeURIComponent(from)}`;
  return requestJson<AllRatesResponse>(url, signal);
}

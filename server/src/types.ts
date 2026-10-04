export interface Config {
  port: number;
  cacheTtlMs: number;
  historyCacheTtlMs: number;
  upstreamTimeoutMs: number;
  upstreamBaseUrl: string;
}

/** 上游返回的一条汇率 */
export interface UpstreamQuote {
  rate: string;
  date: string;
}

/** /api/rates 的响应体 */
export interface RateResponse {
  base: string;
  quote: string;
  rate: string;
  date: string;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

/** 上游某基准币对整个币种表的行情 */
export interface RatesTable {
  date: string;
  rates: Record<string, number>;
}

/** /api/rates/all 的响应体 */
export interface RatesTableResponse {
  base: string;
  date: string;
  rates: Record<string, string>;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
}

export interface HistoryPoint {
  date: string;
  rate: string;
}

/** 基准币对全部币种的时间序列：code → 依次的汇率字符串（对齐交易日） */
export interface HistorySeriesMap {
  [code: string]: string[];
}

export interface HistoryAllData {
  dates: string[];
  series: HistorySeriesMap;
}

export interface HistoryAllResponse {
  base: string;
  days: number;
  startDate: string;
  endDate: string;
  dates: string[];
  series: HistorySeriesMap;
  fetchedAt: number;
  cached: boolean;
  stale: boolean;
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

export type ApiErrorCode =
  | "UNSUPPORTED_CURRENCY"
  | "INVALID_RANGE"
  | "UPSTREAM_UNAVAILABLE";

export interface ApiError {
  error: ApiErrorCode;
  message: string;
}

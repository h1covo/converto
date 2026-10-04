import { isCurrencyCode, type CurrencyCode } from "./currencies";
import { parseAmount } from "./convert";

export interface ConverterState {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  days: number;
}

export const ALLOWED_DAYS = [7, 30, 90, 365];
export const DEFAULT_STATE: ConverterState = { from: "USD", to: "CNY", amount: "100", days: 30 };
export const STATE_STORAGE_KEY = "cc-state";

function codeOr(value: string | null, fallback: CurrencyCode): CurrencyCode {
  const upper = value?.toUpperCase() ?? "";
  return isCurrencyCode(upper) ? upper : fallback;
}

function amountOr(value: string | null, fallback: string): string {
  if (value == null) return fallback;
  return parseAmount(value).ok ? value.trim() : fallback;
}

function daysOr(value: string | number | null, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return ALLOWED_DAYS.includes(n) ? n : fallback;
}

/** 从 URL 参数解析状态，缺失/非法项回退到 fallback。 */
export function parseConverterState(
  params: URLSearchParams,
  fallback: ConverterState = DEFAULT_STATE,
): ConverterState {
  return {
    from: codeOr(params.get("from"), fallback.from),
    to: codeOr(params.get("to"), fallback.to),
    amount: amountOr(params.get("amount"), fallback.amount),
    days: daysOr(params.get("days"), fallback.days),
  };
}

/** 转成 URL 参数更新对象。 */
export function serializeConverterState(state: ConverterState): Record<string, string | null> {
  return {
    from: state.from,
    to: state.to,
    amount: state.amount,
    days: String(state.days),
  };
}

export function parseStoredState(raw: string | null): ConverterState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      from: codeOr(typeof data.from === "string" ? data.from : null, DEFAULT_STATE.from),
      to: codeOr(typeof data.to === "string" ? data.to : null, DEFAULT_STATE.to),
      amount: amountOr(typeof data.amount === "string" ? data.amount : null, DEFAULT_STATE.amount),
      days: daysOr(typeof data.days === "number" || typeof data.days === "string" ? data.days : null, DEFAULT_STATE.days),
    };
  } catch {
    return null;
  }
}

export function loadStoredState(): ConverterState {
  return parseStoredState(window.localStorage.getItem(STATE_STORAGE_KEY)) ?? DEFAULT_STATE;
}

export function saveStoredState(state: ConverterState): void {
  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
}

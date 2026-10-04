/**
 * 服务端支持的币种白名单。与前端 web/src/lib/currencies.ts 保持一致；
 * 白名单校验放在服务端，避免任意参数打向上游。
 * 覆盖 Frankfurter（ECB）支持的常用法币。
 */
export const SUPPORTED_CURRENCIES = new Set([
  "USD",
  "CNY",
  "EUR",
  "JPY",
  "GBP",
  "HKD",
  "AUD",
  "CAD",
  "CHF",
  "SGD",
  "KRW",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "THB",
  "INR",
  "ZAR",
]);

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.has(code);
}

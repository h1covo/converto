import type { RateErrorCode } from "../api/client";
import type { TranslationKey } from "./i18n";

/** 把 API 错误码映射到 i18n key，供组件本地化展示。 */
export function errorKeyForCode(code: RateErrorCode): TranslationKey {
  switch (code) {
    case "NETWORK":
      return "error.network";
    case "UNSUPPORTED_CURRENCY":
      return "error.unsupported";
    case "INVALID_RANGE":
      return "error.invalidRange";
    case "UPSTREAM_UNAVAILABLE":
      return "error.upstream";
  }
}

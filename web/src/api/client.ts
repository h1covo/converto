export type RateErrorCode =
  | "UNSUPPORTED_CURRENCY"
  | "INVALID_RANGE"
  | "UPSTREAM_UNAVAILABLE"
  | "NETWORK";

export class RateError extends Error {
  readonly code: RateErrorCode;

  constructor(code: RateErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RateError";
    this.code = code;
  }
}

/**
 * 统一请求封装：网络失败归一为 NETWORK，非 2xx 读取服务端错误码。
 * 错误文案由 UI 按 code 本地化，故这里不产生用户可见文案。
 */
export async function requestJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new RateError("NETWORK");
  }

  if (!res.ok) {
    let code: RateErrorCode = "UPSTREAM_UNAVAILABLE";
    try {
      const body = (await res.json()) as { error?: RateErrorCode };
      if (body.error) code = body.error;
    } catch {
      // 非 JSON 响应，使用默认错误码
    }
    throw new RateError(code);
  }

  return (await res.json()) as T;
}

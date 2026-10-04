import { useCallback, useEffect, useState } from "react";
import { RateError, type RateErrorCode } from "../api/client";
import { fetchRate, type RateResponse } from "../api/rates";

export interface UseRateResult {
  /** 当前币种对的最近一次成功汇率；无则为 null */
  data: RateResponse | null;
  /** 是否正在加载（首次或切换币种） */
  loading: boolean;
  /** 是否展示的是历史汇率（本次请求失败但有旧值） */
  stale: boolean;
  /** 错误码，由 UI 本地化 */
  error: RateErrorCode | null;
  refresh: () => void;
}

interface State {
  key: string;
  data: RateResponse | null;
  loading: boolean;
  stale: boolean;
  error: RateErrorCode | null;
}

export function useRate(from: string, to: string): UseRateResult {
  const key = `${from}|${to}`;
  const [state, setState] = useState<State>({
    key,
    data: null,
    loading: true,
    stale: false,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  // 渲染期同步重置：切换币种对时立刻丢弃旧值，避免闪现错配汇率
  if (state.key !== key) {
    setState({ key, data: null, loading: true, stale: false, error: null });
  }

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => (s.key === key ? { ...s, loading: true, error: null } : s));

    fetchRate(from, to, controller.signal)
      .then((res) => {
        setState((s) =>
          s.key === key ? { key, data: res, loading: false, stale: res.stale, error: null } : s,
        );
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const code: RateErrorCode =
          err instanceof RateError ? err.code : "UPSTREAM_UNAVAILABLE";
        setState((s) =>
          s.key === key ? { ...s, loading: false, stale: s.data !== null, error: code } : s,
        );
      });

    return () => controller.abort();
  }, [key, from, to, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: state.key === key ? state.data : null,
    loading: state.key === key ? state.loading : true,
    stale: state.key === key ? state.stale : false,
    error: state.key === key ? state.error : null,
    refresh,
  };
}

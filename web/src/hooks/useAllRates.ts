import { useCallback, useEffect, useState } from "react";
import { RateError, type RateErrorCode } from "../api/client";
import { fetchAllRates, type AllRatesResponse } from "../api/rates";

export interface UseAllRatesResult {
  data: AllRatesResponse | null;
  loading: boolean;
  stale: boolean;
  error: RateErrorCode | null;
  refresh: () => void;
}

interface State {
  key: string;
  data: AllRatesResponse | null;
  loading: boolean;
  stale: boolean;
  error: RateErrorCode | null;
}

/** 按基准币取全表汇率：竞态取消、保留上一次成功值、切换基准时同步重置。 */
export function useAllRates(from: string): UseAllRatesResult {
  const key = from;
  const [state, setState] = useState<State>({
    key,
    data: null,
    loading: true,
    stale: false,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  if (state.key !== key) {
    setState({ key, data: null, loading: true, stale: false, error: null });
  }

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => (s.key === key ? { ...s, loading: true, error: null } : s));

    fetchAllRates(from, controller.signal)
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
  }, [key, from, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: state.key === key ? state.data : null,
    loading: state.key === key ? state.loading : true,
    stale: state.key === key ? state.stale : false,
    error: state.key === key ? state.error : null,
    refresh,
  };
}

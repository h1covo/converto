import { useCallback, useEffect, useState } from "react";
import { RateError, type RateErrorCode } from "../api/client";
import { fetchAllHistory, type HistoryAllResponse } from "../api/history";

export interface UseAllHistoryResult {
  data: HistoryAllResponse | null;
  loading: boolean;
  stale: boolean;
  error: RateErrorCode | null;
  refresh: () => void;
}

interface State {
  key: string;
  data: HistoryAllResponse | null;
  loading: boolean;
  stale: boolean;
  error: RateErrorCode | null;
}

/** 按基准币 + 区间取全表序列：竞态取消、切换时同步重置。 */
export function useAllHistory(from: string, days: number): UseAllHistoryResult {
  const key = `${from}|${days}`;
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

    fetchAllHistory(from, days, controller.signal)
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
  }, [key, from, days, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: state.key === key ? state.data : null,
    loading: state.key === key ? state.loading : true,
    stale: state.key === key ? state.stale : false,
    error: state.key === key ? state.error : null,
    refresh,
  };
}

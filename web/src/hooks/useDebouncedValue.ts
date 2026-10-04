import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 返回 [防抖值, 立即提交]。
 * flush 用于「手动转换」按钮：跳过剩余防抖时间，立即采用最新值。
 */
export function useDebouncedValue<T>(value: T, delayMs: number): [T, () => void] {
  const [debounced, setDebounced] = useState(value);
  const valueRef = useRef(value);
  valueRef.current = value;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDebounced(valueRef.current);
  }, []);

  return [debounced, flush];
}

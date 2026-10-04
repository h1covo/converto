/** 读取当前 URL 查询参数。 */
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * 增量更新 URL 查询参数（不改动其它参数），用 replaceState 避免污染历史。
 * 供不同 Provider 各自更新自己的参数而不互相覆盖。
 */
export function setUrlParams(updates: Record<string, string | null>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(null, "", url);
}

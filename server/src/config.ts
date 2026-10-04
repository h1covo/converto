import type { Config } from "./types.js";

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** 从环境变量读取配置，缺失或非法时回退默认值。 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: intFromEnv("PORT", 3001),
    cacheTtlMs: intFromEnv("CACHE_TTL_MS", 5 * 60 * 1000),
    historyCacheTtlMs: intFromEnv("HISTORY_CACHE_TTL_MS", 60 * 60 * 1000),
    upstreamTimeoutMs: intFromEnv("UPSTREAM_TIMEOUT_MS", 8000),
    upstreamBaseUrl: env.UPSTREAM_BASE_URL ?? "https://api.frankfurter.app",
  };
}

export const config: Config = loadConfig();

import path from "node:path";
import express from "express";
import { config } from "./config.js";
import { createHistoryRouter } from "./routes/history.js";
import { createHistoryAllRouter } from "./routes/historyAll.js";
import { createAllRatesRouter } from "./routes/ratesAll.js";
import { createRatesRouter } from "./routes/rates.js";
import {
  createFrankfurterAllHistoryFetcher,
  createFrankfurterAllRatesFetcher,
  createFrankfurterFetcher,
  createFrankfurterHistoryFetcher,
  type AllHistoryFetcher,
  type AllRatesFetcher,
  type HistoryFetcher,
} from "./services/frankfurter.js";
import { createRateCache, type RateCache } from "./services/rateCache.js";
import { createTtlCache, type TtlCache } from "./services/ttlCache.js";
import type { HistoryAllData, HistoryPoint, RatesTable } from "./types.js";

export interface AppDeps {
  /** 注入自定义汇率缓存（测试用）；缺省时用真实 Frankfurter 上游。 */
  cache?: RateCache;
  /** 注入自定义历史缓存（测试用）。 */
  historyCache?: TtlCache<HistoryPoint[]>;
  /** 注入自定义历史取数（测试用）。 */
  historyFetcher?: HistoryFetcher;
  /** 注入自定义全表缓存（测试用）。 */
  allRatesCache?: TtlCache<RatesTable>;
  /** 注入自定义全表取数（测试用）。 */
  allRatesFetcher?: AllRatesFetcher;
  /** 注入自定义全表历史缓存（测试用）。 */
  allHistoryCache?: TtlCache<HistoryAllData>;
  /** 注入自定义全表历史取数（测试用）。 */
  allHistoryFetcher?: AllHistoryFetcher;
  /** 存在时托管该目录的静态文件（生产构建）。 */
  staticDir?: string;
}

export function createApp(deps: AppDeps = {}): express.Express {
  const cache =
    deps.cache ?? createRateCache(config.cacheTtlMs, createFrankfurterFetcher(config));
  const historyCache =
    deps.historyCache ?? createTtlCache<HistoryPoint[]>(config.historyCacheTtlMs);
  const historyFetcher = deps.historyFetcher ?? createFrankfurterHistoryFetcher(config);
  const allRatesCache = deps.allRatesCache ?? createTtlCache<RatesTable>(config.cacheTtlMs);
  const allRatesFetcher = deps.allRatesFetcher ?? createFrankfurterAllRatesFetcher(config);
  const allHistoryCache =
    deps.allHistoryCache ?? createTtlCache<HistoryAllData>(config.historyCacheTtlMs);
  const allHistoryFetcher =
    deps.allHistoryFetcher ?? createFrankfurterAllHistoryFetcher(config);

  const app = express();
  app.use(express.json());
  app.use("/api", createRatesRouter(cache));
  app.use("/api", createHistoryRouter({ cache: historyCache, fetcher: historyFetcher }));
  app.use("/api", createAllRatesRouter({ cache: allRatesCache, fetcher: allRatesFetcher }));
  app.use("/api", createHistoryAllRouter({ cache: allHistoryCache, fetcher: allHistoryFetcher }));

  if (deps.staticDir) {
    const staticDir = deps.staticDir;
    app.use(express.static(staticDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  return app;
}

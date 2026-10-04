import { Router } from "express";
import { isSupportedCurrency, SUPPORTED_CURRENCIES } from "../currencies.js";
import type { AllRatesFetcher } from "../services/frankfurter.js";
import type { TtlCache } from "../services/ttlCache.js";
import type { ApiError, RatesTable, RatesTableResponse } from "../types.js";

export interface AllRatesRouterDeps {
  cache: TtlCache<RatesTable>;
  fetcher: AllRatesFetcher;
}

const DEFAULT_BASE = "USD";

export function createAllRatesRouter(deps: AllRatesRouterDeps): Router {
  const router = Router();

  router.get("/rates/all", async (req, res) => {
    const base = String(req.query.from ?? DEFAULT_BASE).toUpperCase();

    if (!isSupportedCurrency(base)) {
      const body: ApiError = {
        error: "UNSUPPORTED_CURRENCY",
        message: `不支持的币种：${base || "(空)"}`,
      };
      res.status(400).json(body);
      return;
    }

    try {
      const { value, fetchedAt, cached, stale } = await deps.cache.get(`all|${base}`, () =>
        deps.fetcher(base),
      );
      // 只返回受支持且非基准的币种，汇率以字符串传输避免精度丢失
      const rates: Record<string, string> = {};
      for (const code of SUPPORTED_CURRENCIES) {
        if (code === base) continue;
        const rate = value.rates[code];
        if (rate != null) rates[code] = String(rate);
      }
      const body: RatesTableResponse = {
        base,
        date: value.date,
        rates,
        fetchedAt,
        cached,
        stale,
      };
      res.json(body);
    } catch {
      const body: ApiError = {
        error: "UPSTREAM_UNAVAILABLE",
        message: "汇率服务暂时不可用，请稍后重试",
      };
      res.status(502).json(body);
    }
  });

  return router;
}

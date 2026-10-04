import { Router } from "express";
import { isSupportedCurrency } from "../currencies.js";
import type { AllHistoryFetcher } from "../services/frankfurter.js";
import type { TtlCache } from "../services/ttlCache.js";
import type { ApiError, HistoryAllData, HistoryAllResponse } from "../types.js";
import { ALLOWED_DAYS, DEFAULT_DAYS } from "./history.js";

export interface HistoryAllRouterDeps {
  cache: TtlCache<HistoryAllData>;
  fetcher: AllHistoryFetcher;
  now?: () => Date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function createHistoryAllRouter(deps: HistoryAllRouterDeps): Router {
  const now = deps.now ?? (() => new Date());
  const router = Router();

  router.get("/rates/history/all", async (req, res) => {
    const base = String(req.query.from ?? "").toUpperCase();
    const rawDays = req.query.days;
    const days = rawDays === undefined ? DEFAULT_DAYS : Number(rawDays);

    if (!isSupportedCurrency(base)) {
      const body: ApiError = {
        error: "UNSUPPORTED_CURRENCY",
        message: `不支持的币种：${base || "(空)"}`,
      };
      res.status(400).json(body);
      return;
    }

    if (!ALLOWED_DAYS.has(days)) {
      const body: ApiError = {
        error: "INVALID_RANGE",
        message: `不支持的时间范围：${String(rawDays)}（可选 7/30/90/365）`,
      };
      res.status(400).json(body);
      return;
    }

    const end = now();
    const start = new Date(end.getTime() - days * 86_400_000);
    const startDate = isoDate(start);
    const endDate = isoDate(end);

    try {
      const { value, fetchedAt, cached, stale } = await deps.cache.get(
        `historyall|${base}|${days}`,
        () => deps.fetcher(base, startDate, endDate),
      );
      const body: HistoryAllResponse = {
        base,
        days,
        startDate,
        endDate,
        dates: value.dates,
        series: value.series,
        fetchedAt,
        cached,
        stale,
      };
      res.json(body);
    } catch {
      const body: ApiError = {
        error: "UPSTREAM_UNAVAILABLE",
        message: "历史汇率服务暂时不可用，请稍后重试",
      };
      res.status(502).json(body);
    }
  });

  return router;
}

import { Router } from "express";
import { isSupportedCurrency } from "../currencies.js";
import type { HistoryFetcher } from "../services/frankfurter.js";
import type { TtlCache } from "../services/ttlCache.js";
import type { ApiError, HistoryPoint, HistoryResponse } from "../types.js";

export const ALLOWED_DAYS = new Set([7, 30, 90, 365]);
export const DEFAULT_DAYS = 30;

export interface HistoryRouterDeps {
  cache: TtlCache<HistoryPoint[]>;
  fetcher: HistoryFetcher;
  now?: () => Date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 生成 [start, end] 内的工作日（周一至周五）日期，用于同币种平线。 */
function weekdaysBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) out.push(isoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function createHistoryRouter(deps: HistoryRouterDeps): Router {
  const now = deps.now ?? (() => new Date());
  const router = Router();

  router.get("/rates/history", async (req, res) => {
    const from = String(req.query.from ?? "").toUpperCase();
    const to = String(req.query.to ?? "").toUpperCase();
    const rawDays = req.query.days;
    const days = rawDays === undefined ? DEFAULT_DAYS : Number(rawDays);

    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
      const body: ApiError = {
        error: "UNSUPPORTED_CURRENCY",
        message: `不支持的币种：${from || "(空)"} → ${to || "(空)"}`,
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

    // 同币种：生成工作日平线，不请求上游
    if (from === to) {
      const points: HistoryPoint[] = weekdaysBetween(start, end).map((date) => ({
        date,
        rate: "1",
      }));
      const body: HistoryResponse = {
        base: from,
        quote: to,
        days,
        startDate,
        endDate,
        points,
        latest: "1",
        fetchedAt: Date.now(),
        cached: true,
        stale: false,
      };
      res.json(body);
      return;
    }

    try {
      const key = `history|${from}|${to}|${days}`;
      const { value: points, fetchedAt, cached, stale } = await deps.cache.get(key, () =>
        deps.fetcher(from, to, startDate, endDate),
      );
      const body: HistoryResponse = {
        base: from,
        quote: to,
        days,
        startDate,
        endDate,
        points,
        latest: points.length ? points[points.length - 1].rate : null,
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

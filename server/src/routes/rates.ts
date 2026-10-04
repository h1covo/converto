import { Router } from "express";
import { isSupportedCurrency } from "../currencies.js";
import type { RateCache } from "../services/rateCache.js";
import type { ApiError, RateResponse } from "../types.js";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createRatesRouter(cache: RateCache): Router {
  const router = Router();

  router.get("/rates", async (req, res) => {
    const from = String(req.query.from ?? "").toUpperCase();
    const to = String(req.query.to ?? "").toUpperCase();

    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
      const body: ApiError = {
        error: "UNSUPPORTED_CURRENCY",
        message: `不支持的币种：${from || "(空)"} → ${to || "(空)"}`,
      };
      res.status(400).json(body);
      return;
    }

    if (from === to) {
      const body: RateResponse = {
        base: from,
        quote: to,
        rate: "1",
        date: todayIso(),
        fetchedAt: Date.now(),
        cached: true,
        stale: false,
      };
      res.json(body);
      return;
    }

    try {
      const { quote, cached, stale } = await cache.get(from, to);
      const body: RateResponse = {
        base: from,
        quote: to,
        rate: quote.rate,
        date: quote.date,
        fetchedAt: quote.fetchedAt,
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

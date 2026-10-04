import { isCurrencyCode, type CurrencyCode } from "./currencies";

export interface FavPair {
  from: CurrencyCode;
  to: CurrencyCode;
}

export interface HistoryItem extends FavPair {
  amount: string;
  at: number;
}

export const FAVS_KEY = "cc-favs";
export const HISTORY_KEY = "cc-history";
export const FAVS_MAX = 12;
export const HISTORY_MAX = 20;

function isPair(value: unknown): value is FavPair {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.from === "string" &&
    typeof record.to === "string" &&
    isCurrencyCode(record.from) &&
    isCurrencyCode(record.to)
  );
}

function samePair(a: FavPair, b: FavPair): boolean {
  return a.from === b.from && a.to === b.to;
}

export function parseFavs(raw: string | null): FavPair[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: FavPair[] = [];
    for (const item of data) {
      if (isPair(item) && !out.some((pair) => samePair(pair, item))) {
        out.push({ from: item.from, to: item.to });
      }
    }
    return out.slice(0, FAVS_MAX);
  } catch {
    return [];
  }
}

export function serializeFavs(favs: FavPair[]): string {
  return JSON.stringify(favs);
}

export function addFav(favs: FavPair[], pair: FavPair): FavPair[] {
  const rest = favs.filter((item) => !samePair(item, pair));
  return [pair, ...rest].slice(0, FAVS_MAX);
}

export function removeFav(favs: FavPair[], pair: FavPair): FavPair[] {
  return favs.filter((item) => !samePair(item, pair));
}

export function hasFav(favs: FavPair[], pair: FavPair): boolean {
  return favs.some((item) => samePair(item, pair));
}

/** 数组内移动元素（供收藏拖拽排序）。 */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  const target = Math.max(0, Math.min(to, next.length));
  next.splice(target, 0, item);
  return next;
}

export function parseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: HistoryItem[] = [];
    for (const item of data) {
      if (!isPair(item)) continue;
      const record = item as unknown as Record<string, unknown>;
      const amount = typeof record.amount === "string" ? record.amount : "";
      const at = typeof record.at === "number" ? record.at : 0;
      const dup = out.some(
        (entry) => samePair(entry, item) && entry.amount === amount,
      );
      if (!dup) out.push({ from: item.from, to: item.to, amount, at });
    }
    return out.slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

export function serializeHistory(list: HistoryItem[]): string {
  return JSON.stringify(list);
}

export function pushHistory(list: HistoryItem[], item: HistoryItem): HistoryItem[] {
  const rest = list.filter(
    (entry) => !(samePair(entry, item) && entry.amount === item.amount),
  );
  return [item, ...rest].slice(0, HISTORY_MAX);
}

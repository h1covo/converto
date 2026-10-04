import { CURRENCY_LIST, type CurrencyMeta } from "./currencies";

/** 归一化查询串：去首尾空白、转小写、去内部空白。 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 给单个币种对查询串打分，null 表示不匹配。
 * 分数越小越靠前：代码精确 > 代码前缀 > 拼音前缀 > 英文前缀 > 中文包含 > 代码包含 > 英文包含 > 拼音包含。
 */
function scoreOf(meta: CurrencyMeta, query: string): number | null {
  const code = meta.code.toLowerCase();
  const en = meta.enName.toLowerCase().replace(/\s+/g, "");
  const pinyinTokens = meta.pinyin.toLowerCase().split(/\s+/).filter(Boolean);
  const pinyinJoined = pinyinTokens.join("");

  if (code === query) return 0;
  if (code.startsWith(query)) return 1;
  if (pinyinTokens.some((token) => token.startsWith(query))) return 2;
  if (en.startsWith(query)) return 3;
  if (meta.zhName.includes(query)) return 4;
  if (code.includes(query)) return 5;
  if (en.includes(query)) return 6;
  if (pinyinJoined.includes(query)) return 7;
  return null;
}

/** 按查询过滤并排序币种；空查询返回全部（常用在前）。 */
export function filterCurrencies(query: string): CurrencyMeta[] {
  const normalized = normalizeQuery(query);
  if (normalized === "") return CURRENCY_LIST;

  const scored: Array<{ meta: CurrencyMeta; score: number }> = [];
  for (const meta of CURRENCY_LIST) {
    const score = scoreOf(meta, normalized);
    if (score !== null) scored.push({ meta, score });
  }
  scored.sort((a, b) => a.score - b.score || a.meta.code.localeCompare(b.meta.code));
  return scored.map((entry) => entry.meta);
}

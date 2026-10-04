import type { Lang } from "./i18n";

export type CurrencyCode =
  | "USD"
  | "CNY"
  | "EUR"
  | "JPY"
  | "GBP"
  | "HKD"
  | "AUD"
  | "CAD"
  | "CHF"
  | "SGD"
  | "KRW"
  | "NZD"
  | "SEK"
  | "NOK"
  | "DKK"
  | "THB"
  | "INR"
  | "ZAR";

export interface CurrencyMeta {
  code: CurrencyCode;
  /** 货币符号，用于结果展示 */
  symbol: string;
  /** 中文名称，按大陆规范 */
  zhName: string;
  /** 英文名称，用于搜索 */
  enName: string;
  /** 拼音别名（空格分隔），用于搜索 */
  pinyin: string;
  /** 该币种的标准小数位（JPY / KRW 为 0） */
  decimals: number;
  /** 是否常用，用于选择器分组 */
  popular?: boolean;
}

// 记录顺序即展示顺序：常用在前
export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", zhName: "美元", enName: "US Dollar", pinyin: "meiyuan", decimals: 2, popular: true },
  CNY: { code: "CNY", symbol: "¥", zhName: "人民币", enName: "Chinese Yuan", pinyin: "renminbi yuan", decimals: 2, popular: true },
  EUR: { code: "EUR", symbol: "€", zhName: "欧元", enName: "Euro", pinyin: "ouyuan", decimals: 2, popular: true },
  JPY: { code: "JPY", symbol: "¥", zhName: "日元", enName: "Japanese Yen", pinyin: "riyuan yen", decimals: 0, popular: true },
  GBP: { code: "GBP", symbol: "£", zhName: "英镑", enName: "British Pound", pinyin: "yingbang", decimals: 2, popular: true },
  HKD: { code: "HKD", symbol: "HK$", zhName: "港币", enName: "Hong Kong Dollar", pinyin: "gangbi", decimals: 2, popular: true },
  AUD: { code: "AUD", symbol: "A$", zhName: "澳元", enName: "Australian Dollar", pinyin: "aoyuan", decimals: 2, popular: true },
  CAD: { code: "CAD", symbol: "C$", zhName: "加元", enName: "Canadian Dollar", pinyin: "jiayuan", decimals: 2, popular: true },
  CHF: { code: "CHF", symbol: "CHF", zhName: "瑞士法郎", enName: "Swiss Franc", pinyin: "ruishifalang ruilang", decimals: 2, popular: true },
  SGD: { code: "SGD", symbol: "S$", zhName: "新加坡元", enName: "Singapore Dollar", pinyin: "xinjiapo", decimals: 2, popular: true },
  KRW: { code: "KRW", symbol: "₩", zhName: "韩元", enName: "South Korean Won", pinyin: "hanyuan", decimals: 0, popular: true },
  NZD: { code: "NZD", symbol: "NZ$", zhName: "新西兰元", enName: "New Zealand Dollar", pinyin: "xinxilan", decimals: 2 },
  SEK: { code: "SEK", symbol: "kr", zhName: "瑞典克朗", enName: "Swedish Krona", pinyin: "ruidian", decimals: 2 },
  NOK: { code: "NOK", symbol: "kr", zhName: "挪威克朗", enName: "Norwegian Krone", pinyin: "nuowei", decimals: 2 },
  DKK: { code: "DKK", symbol: "kr", zhName: "丹麦克朗", enName: "Danish Krone", pinyin: "danmai", decimals: 2 },
  THB: { code: "THB", symbol: "฿", zhName: "泰铢", enName: "Thai Baht", pinyin: "taizhu", decimals: 2 },
  INR: { code: "INR", symbol: "₹", zhName: "印度卢比", enName: "Indian Rupee", pinyin: "yinduluobi", decimals: 2 },
  ZAR: { code: "ZAR", symbol: "R", zhName: "南非兰特", enName: "South African Rand", pinyin: "nanfeilante", decimals: 2 },
};

export const CURRENCY_LIST: CurrencyMeta[] = Object.values(CURRENCIES);

const CURRENCY_CODES = new Set<string>(CURRENCY_LIST.map((meta) => meta.code));

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.has(value);
}

/** 按语言取币种名 */
export function currencyName(meta: CurrencyMeta, lang: Lang): string {
  return lang === "en" ? meta.enName : meta.zhName;
}

/** 下拉/快捷切换的显示文本，如 “USD 美元” / “USD US Dollar” */
export function currencyLabel(meta: CurrencyMeta, lang: Lang = "zh"): string {
  return `${meta.code} ${currencyName(meta, lang)}`;
}

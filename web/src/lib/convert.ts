import Decimal from "decimal.js";

/** 业务金额上限 1e15；超过视为无意义输入 */
export const MAX_AMOUNT = new Decimal("1e15");

export type ParseErrorReason = "empty" | "invalid" | "negative" | "tooLarge";

export type ParseResult =
  | { ok: true; value: Decimal }
  | { ok: false; reason: ParseErrorReason };

// 允许：123 / 123. / 123.45 / .45；可选前导负号（用于判定 negative）
const NUMERIC_RE = /^-?\d+(\.\d*)?$|^-?\.\d+$/;

/**
 * 归一化金额输入：
 * - 全角数字/小数点/负号 → 半角（中文输入法下 "１００．５" 应能识别）
 * - 去掉千分位逗号与空白（含全角空格），便于粘贴 "1,000.50"
 * 保留其它字符，以便仍然能给出「非法字符」提示。
 */
export function normalizeAmountInput(raw: string): string {
  return raw
    .replace(/[\uFF10-\uFF19]/g, (digit) => String(digit.charCodeAt(0) - 0xff10))
    .replace(/\uFF0D/g, "-")
    .replace(/[．。]/g, ".")
    .replace(/[，,]/g, "")
    .replace(/[\s\u3000]/g, "");
}

/** 解析用户输入的金额字符串，给出明确的失败原因。 */
export function parseAmount(input: string): ParseResult {
  const raw = input.trim();
  if (raw === "") return { ok: false, reason: "empty" };
  if (!NUMERIC_RE.test(raw)) return { ok: false, reason: "invalid" };

  let value: Decimal;
  try {
    value = new Decimal(raw);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (value.isNegative()) return { ok: false, reason: "negative" };
  if (value.greaterThan(MAX_AMOUNT)) return { ok: false, reason: "tooLarge" };
  return { ok: true, value };
}

/** 精确换算：amount × rate（全程十进制，无浮点误差）。 */
export function convert(amount: Decimal.Value, rate: Decimal.Value): Decimal {
  return new Decimal(amount).times(new Decimal(rate));
}

/** 反向汇率：1 / rate。 */
export function invertRate(rate: Decimal.Value): Decimal {
  return new Decimal(1).div(new Decimal(rate));
}

/** 给整数字符串加千分位。 */
function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 按币种小数位格式化，四舍五入（HALF_UP），带千分位。 */
export function formatAmount(value: Decimal, decimals: number): string {
  const fixed = value.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toFixed(decimals);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [intPart, fracPart] = unsigned.split(".");
  const grouped = groupThousands(intPart);
  const withFrac = fracPart ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${withFrac}` : withFrac;
}

/** 展示用汇率：最多 6 位小数并去掉尾随 0，如 6.7046 / 157.67。 */
export function formatRate(rate: Decimal.Value): string {
  return new Decimal(rate).toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toFixed(6).replace(/\.?0+$/, "");
}

/** 矩阵/密集展示用紧凑汇率：按量级取 3–4 位有效数字，如 6.705 / 157.7 / 0.00497。 */
export function formatCompactRate(rate: Decimal.Value): string {
  const value = Number(rate);
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const digits = Math.abs(value) >= 1000 ? 3 : 4;
  return Number(value.toPrecision(digits)).toString();
}

export type AmountErrorKey = "amount.invalid" | "amount.negative" | "amount.tooLarge";

/** 把解析失败原因映射到 i18n key；空输入不算错误，返回 null。 */
export function parseErrorKey(reason: ParseErrorReason): AmountErrorKey | null {
  switch (reason) {
    case "invalid":
      return "amount.invalid";
    case "negative":
      return "amount.negative";
    case "tooLarge":
      return "amount.tooLarge";
    case "empty":
      return null;
  }
}

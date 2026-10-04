import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  convert,
  formatAmount,
  formatCompactRate,
  formatRate,
  invertRate,
  normalizeAmountInput,
  parseAmount,
  parseErrorKey,
} from "./convert";

describe("parseAmount", () => {
  it("空字符串 → empty（非错误）", () => {
    expect(parseAmount("")).toEqual({ ok: false, reason: "empty" });
    expect(parseAmount("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("0 合法", () => {
    const r = parseAmount("0");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.toString()).toBe("0");
  });

  it("接受整数、小数、省略整数位与尾随小数点", () => {
    for (const s of ["100", "100.5", ".5", "100.", "0.25"]) {
      expect(parseAmount(s).ok).toBe(true);
    }
  });

  it("负数 → negative", () => {
    expect(parseAmount("-5")).toEqual({ ok: false, reason: "negative" });
  });

  it("非法字符 → invalid", () => {
    for (const s of ["abc", "1,000", "1 000", "1.2.3", "1e5", "$5", "5%"]) {
      expect(parseAmount(s)).toEqual({ ok: false, reason: "invalid" });
    }
  });

  it("超过 1e15 → tooLarge，边界值 1e15 合法", () => {
    expect(parseAmount("1000000000000000").ok).toBe(true);
    expect(parseAmount("1000000000000001")).toEqual({ ok: false, reason: "tooLarge" });
  });

  it("parseErrorKey：empty 无提示，其余映射到 i18n key", () => {
    expect(parseErrorKey("empty")).toBeNull();
    expect(parseErrorKey("negative")).toBe("amount.negative");
    expect(parseErrorKey("invalid")).toBe("amount.invalid");
    expect(parseErrorKey("tooLarge")).toBe("amount.tooLarge");
  });
});

describe("normalizeAmountInput", () => {
  it("全角数字/小数点/负号转半角", () => {
    expect(normalizeAmountInput("１００．５")).toBe("100.5");
    expect(normalizeAmountInput("－２３")).toBe("-23");
    expect(normalizeAmountInput("１２３。４")).toBe("123.4");
  });

  it("去掉千分位与空白", () => {
    expect(normalizeAmountInput("1,000.50")).toBe("1000.50");
    expect(normalizeAmountInput("1 000　50")).toBe("100050");
  });

  it("保留其它字符以便仍能提示非法", () => {
    expect(normalizeAmountInput("12a")).toBe("12a");
    expect(parseAmount(normalizeAmountInput("１２a")).ok).toBe(false);
  });
});

describe("convert", () => {
  it("常规换算", () => {
    expect(convert("100", "7.24").toString()).toBe("724");
  });

  it("避免浮点误差：0.1 × 3 = 0.3", () => {
    expect(convert("0.1", "3").toString()).toBe("0.3");
    // 对照：原生浮点会得到 0.30000000000000004
    expect(0.1 * 3).not.toBe(0.3);
  });

  it("接受字符串汇率（来自 API）与大数", () => {
    expect(convert("999999999999", "7.24").toString()).toBe("7239999999992.76");
  });

  it("invertRate 反向汇率", () => {
    expect(invertRate("8").toString()).toBe("0.125");
    expect(invertRate("4").toString()).toBe("0.25");
    // 与正向换算互为逆运算
    expect(new Decimal(6.7046).times(invertRate("6.7046")).toDecimalPlaces(10).toString()).toBe("1");
  });
});

describe("formatAmount", () => {
  it("默认 2 位小数", () => {
    expect(formatAmount(new Decimal("724"), 2)).toBe("724.00");
  });

  it("千分位", () => {
    expect(formatAmount(new Decimal("1234567.5"), 2)).toBe("1,234,567.50");
  });

  it("JPY 0 位小数", () => {
    expect(formatAmount(new Decimal("15767.89"), 0)).toBe("15,768");
  });

  it("四舍五入 HALF_UP", () => {
    expect(formatAmount(new Decimal("2.345"), 2)).toBe("2.35");
    expect(formatAmount(new Decimal("2.344"), 2)).toBe("2.34");
  });

  it("浮点陷阱：0.30 不变成 0.30000000000000004", () => {
    expect(formatAmount(convert("0.1", "3"), 2)).toBe("0.30");
  });

  it("负数与千分位组合", () => {
    expect(formatAmount(new Decimal("-1234.5"), 2)).toBe("-1,234.50");
  });
});

describe("formatCompactRate", () => {
  it("按量级取有效数字", () => {
    expect(formatCompactRate("6.7046")).toBe("6.705");
    expect(formatCompactRate("157.67")).toBe("157.7");
    expect(formatCompactRate("0.149152")).toBe("0.1492");
    expect(formatCompactRate("0.00497")).toBe("0.00497");
    expect(formatCompactRate("134828")).toBe("135000");
    expect(formatCompactRate("0")).toBe("0");
  });
});

describe("formatRate", () => {
  it("去掉尾随 0，最多 6 位", () => {
    expect(formatRate("6.7046")).toBe("6.7046");
    expect(formatRate("157.67")).toBe("157.67");
    expect(formatRate("7")).toBe("7");
  });
});

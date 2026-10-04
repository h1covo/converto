import { describe, expect, it } from "vitest";
import { CURRENCY_LIST } from "./currencies";
import { filterCurrencies, normalizeQuery } from "./currencySearch";

describe("normalizeQuery", () => {
  it("去空白并转小写", () => {
    expect(normalizeQuery("  KRW ")).toBe("krw");
    expect(normalizeQuery("Xin Jia Po")).toBe("xinjiapo");
  });
});

describe("filterCurrencies", () => {
  it("空查询返回全部币种（常用在前）", () => {
    const all = filterCurrencies("");
    expect(all).toHaveLength(CURRENCY_LIST.length);
    expect(all[0].popular).toBe(true);
  });

  it("代码精确匹配优先", () => {
    expect(filterCurrencies("cad")[0].code).toBe("CAD");
    expect(filterCurrencies("KRW")[0].code).toBe("KRW");
  });

  it("代码前缀匹配", () => {
    const codes = filterCurrencies("au").map((m) => m.code);
    expect(codes).toContain("AUD");
  });

  it("拼音匹配：ao → 澳元，hanyuan → 韩元", () => {
    expect(filterCurrencies("ao")[0].code).toBe("AUD");
    expect(filterCurrencies("hanyuan")[0].code).toBe("KRW");
  });

  it("中文匹配：韩 → 韩元，瑞 → 瑞士法郎", () => {
    expect(filterCurrencies("韩")[0].code).toBe("KRW");
    expect(filterCurrencies("瑞士")[0].code).toBe("CHF");
  });

  it("英文名匹配：swiss → CHF，rand → ZAR", () => {
    expect(filterCurrencies("swiss")[0].code).toBe("CHF");
    expect(filterCurrencies("rand")[0].code).toBe("ZAR");
  });

  it("无匹配返回空数组", () => {
    expect(filterCurrencies("zzzz")).toHaveLength(0);
  });

  it("大小写与空格不敏感", () => {
    expect(filterCurrencies("  Krw ")[0].code).toBe("KRW");
  });
});

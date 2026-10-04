import { describe, expect, it } from "vitest";
import { DICTS, translate, type TranslationKey } from "./i18n";

describe("i18n", () => {
  it("中英文键完全对齐，无缺失/多余", () => {
    const zhKeys = Object.keys(DICTS.zh).sort();
    const enKeys = Object.keys(DICTS.en).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it("取值与参数插值", () => {
    expect(translate("zh", "app.title")).toBe("Converto");
    expect(translate("en", "app.title")).toBe("Converto");
    expect(translate("zh", "rate.meta", { date: "2026-10-02", time: "14:30" })).toContain(
      "2026-10-02",
    );
    expect(translate("en", "rate.meta", { date: "2026-10-02", time: "14:30" })).toContain("14:30");
  });

  it("所有键都有非空文案", () => {
    for (const lang of ["zh", "en"] as const) {
      for (const key of Object.keys(DICTS[lang]) as TranslationKey[]) {
        expect(DICTS[lang][key].length).toBeGreaterThan(0);
      }
    }
  });
});

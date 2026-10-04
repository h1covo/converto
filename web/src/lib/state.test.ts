import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  parseConverterState,
  parseStoredState,
  serializeConverterState,
} from "./state";

describe("parseConverterState", () => {
  it("解析合法 URL 参数", () => {
    const params = new URLSearchParams("from=eur&to=jpy&amount=500&days=90");
    expect(parseConverterState(params)).toEqual({
      from: "EUR",
      to: "JPY",
      amount: "500",
      days: 90,
    });
  });

  it("非法值回退默认", () => {
    const params = new URLSearchParams("from=BTC&to=&amount=abc&days=15");
    expect(parseConverterState(params)).toEqual(DEFAULT_STATE);
  });

  it("缺失项回退到 fallback", () => {
    const fallback = { from: "GBP", to: "USD", amount: "10", days: 7 } as const;
    const params = new URLSearchParams("to=AUD");
    expect(parseConverterState(params, fallback)).toEqual({
      from: "GBP",
      to: "AUD",
      amount: "10",
      days: 7,
    });
  });
});

describe("serializeConverterState", () => {
  it("转成参数对象", () => {
    expect(serializeConverterState({ from: "USD", to: "CNY", amount: "100", days: 30 })).toEqual({
      from: "USD",
      to: "CNY",
      amount: "100",
      days: "30",
    });
  });
});

describe("parseStoredState", () => {
  it("解析合法 JSON", () => {
    expect(parseStoredState('{"from":"AUD","to":"CNY","amount":"50","days":365}')).toEqual({
      from: "AUD",
      to: "CNY",
      amount: "50",
      days: 365,
    });
  });

  it("空/损坏 JSON 返回 null", () => {
    expect(parseStoredState(null)).toBeNull();
    expect(parseStoredState("{not json")).toBeNull();
  });

  it("字段非法则回退默认", () => {
    expect(parseStoredState('{"from":"XXX","to":"CNY","amount":"-5","days":999}')).toEqual({
      from: "USD",
      to: "CNY",
      amount: "100",
      days: 30,
    });
  });
});

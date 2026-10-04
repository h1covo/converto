import { describe, expect, it } from "vitest";
import { CURRENCY_LIST } from "./currencies";
import {
  addFav,
  arrayMove,
  FAVS_MAX,
  hasFav,
  HISTORY_MAX,
  parseFavs,
  parseHistory,
  pushHistory,
  removeFav,
  serializeFavs,
  type HistoryItem,
} from "./storage";

describe("favorites", () => {
  it("parseFavs 过滤非法项并去重", () => {
    const raw = JSON.stringify([
      { from: "USD", to: "CNY" },
      { from: "USD", to: "CNY" },
      { from: "BTC", to: "CNY" },
      { from: "EUR", to: "JPY" },
      "nonsense",
    ]);
    expect(parseFavs(raw)).toEqual([
      { from: "USD", to: "CNY" },
      { from: "EUR", to: "JPY" },
    ]);
  });

  it("parseFavs 处理空/损坏", () => {
    expect(parseFavs(null)).toEqual([]);
    expect(parseFavs("{bad")).toEqual([]);
  });

  it("addFav 置顶去重并封顶", () => {
    let favs = [
      { from: "USD", to: "CNY" },
      { from: "EUR", to: "JPY" },
    ] as ReturnType<typeof parseFavs>;
    favs = addFav(favs, { from: "EUR", to: "JPY" });
    expect(favs[0]).toEqual({ from: "EUR", to: "JPY" });
    expect(favs).toHaveLength(2);
  });

  it("addFav 超过上限截断（不同币对）", () => {
    const codes = CURRENCY_LIST.map((meta) => meta.code);
    let favs: ReturnType<typeof parseFavs> = [];
    for (let i = 0; i < FAVS_MAX + 3; i++) {
      favs = addFav(favs, { from: codes[i], to: codes[i + 1] });
    }
    expect(favs).toHaveLength(FAVS_MAX);
    // 最近添加的在最前
    expect(favs[0]).toEqual({ from: codes[FAVS_MAX + 2], to: codes[FAVS_MAX + 3] });
  });

  it("removeFav / hasFav", () => {
    const favs = [{ from: "USD", to: "CNY" }] as ReturnType<typeof parseFavs>;
    expect(hasFav(favs, { from: "USD", to: "CNY" })).toBe(true);
    expect(removeFav(favs, { from: "USD", to: "CNY" })).toEqual([]);
  });

  it("serializeFavs 往返一致", () => {
    const favs = [{ from: "AUD", to: "CNY" }] as ReturnType<typeof parseFavs>;
    expect(parseFavs(serializeFavs(favs))).toEqual(favs);
  });
});

describe("arrayMove", () => {
  it("前移与后移", () => {
    expect(arrayMove(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(arrayMove(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(arrayMove(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });
  it("越界安全", () => {
    expect(arrayMove(["a", "b"], -1, 1)).toEqual(["a", "b"]);
    expect(arrayMove(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});

describe("history", () => {
  const item = (amount: string, at = 1): HistoryItem => ({
    from: "USD",
    to: "CNY",
    amount,
    at,
  });

  it("pushHistory 去重置顶", () => {
    let list = [item("100"), item("200")];
    list = pushHistory(list, item("100", 2));
    expect(list[0]).toEqual(item("100", 2));
    expect(list).toHaveLength(2);
  });

  it("pushHistory 封顶", () => {
    let list: HistoryItem[] = [];
    for (let i = 0; i < HISTORY_MAX + 5; i++) list = pushHistory(list, item(String(i)));
    expect(list).toHaveLength(HISTORY_MAX);
    expect(list[0].amount).toBe(String(HISTORY_MAX + 4));
  });

  it("parseHistory 过滤非法项", () => {
    const raw = JSON.stringify([
      { from: "USD", to: "CNY", amount: "100", at: 1 },
      { from: "BTC", to: "CNY", amount: "1", at: 2 },
    ]);
    expect(parseHistory(raw)).toEqual([{ from: "USD", to: "CNY", amount: "100", at: 1 }]);
    expect(parseHistory(null)).toEqual([]);
  });
});

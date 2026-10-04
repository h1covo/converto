import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrencyCode } from "../lib/currencies";
import {
  loadStoredState,
  parseConverterState,
  saveStoredState,
  serializeConverterState,
  type ConverterState,
} from "../lib/state";
import {
  addFav,
  arrayMove,
  FAVS_KEY,
  hasFav,
  HISTORY_KEY,
  parseFavs,
  parseHistory,
  pushHistory,
  removeFav,
  serializeFavs,
  serializeHistory,
  type FavPair,
  type HistoryItem,
} from "../lib/storage";
import { getUrlParams, setUrlParams } from "../lib/url";

interface ConverterValue {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  days: number;
  setFrom: (code: CurrencyCode) => void;
  setTo: (code: CurrencyCode) => void;
  setAmount: (amount: string) => void;
  setDays: (days: number) => void;
  swap: () => void;
  favorites: FavPair[];
  isFavorite: (pair: FavPair) => boolean;
  saveFavorite: (pair: FavPair) => void;
  removeFavorite: (pair: FavPair) => void;
  reorderFavorite: (from: number, to: number) => void;
  history: HistoryItem[];
  recordHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const ConverterContext = createContext<ConverterValue | null>(null);

export function ConverterProvider({ children }: { children: ReactNode }) {
  // 初始状态优先级：URL > localStorage > 默认
  const [state, setState] = useState<ConverterState>(() =>
    parseConverterState(getUrlParams(), loadStoredState()),
  );
  const [favorites, setFavorites] = useState<FavPair[]>(() =>
    parseFavs(window.localStorage.getItem(FAVS_KEY)),
  );
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    parseHistory(window.localStorage.getItem(HISTORY_KEY)),
  );

  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  // 同步 URL（防抖，避免每次击键都改地址栏）
  useEffect(() => {
    const timer = setTimeout(() => setUrlParams(serializeConverterState(state)), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const setFrom = useCallback((from: CurrencyCode) => setState((s) => ({ ...s, from })), []);
  const setTo = useCallback((to: CurrencyCode) => setState((s) => ({ ...s, to })), []);
  const setAmount = useCallback((amount: string) => setState((s) => ({ ...s, amount })), []);
  const setDays = useCallback((days: number) => setState((s) => ({ ...s, days })), []);
  const swap = useCallback(
    () => setState((s) => ({ ...s, from: s.to, to: s.from })),
    [],
  );

  const saveFavorite = useCallback(
    (pair: FavPair) => {
      const next = addFav(favorites, pair);
      setFavorites(next);
      window.localStorage.setItem(FAVS_KEY, serializeFavs(next));
    },
    [favorites],
  );
  const removeFavorite = useCallback(
    (pair: FavPair) => {
      const next = removeFav(favorites, pair);
      setFavorites(next);
      window.localStorage.setItem(FAVS_KEY, serializeFavs(next));
    },
    [favorites],
  );
  const isFavorite = useCallback((pair: FavPair) => hasFav(favorites, pair), [favorites]);
  const reorderFavorite = useCallback((from: number, to: number) => {
    setFavorites((prev) => {
      const next = arrayMove(prev, from, to);
      window.localStorage.setItem(FAVS_KEY, serializeFavs(next));
      return next;
    });
  }, []);

  const recordHistory = useCallback(
    (item: HistoryItem) => {
      const next = pushHistory(history, item);
      setHistory(next);
      window.localStorage.setItem(HISTORY_KEY, serializeHistory(next));
    },
    [history],
  );
  const clearHistory = useCallback(() => {
    setHistory([]);
    window.localStorage.removeItem(HISTORY_KEY);
  }, []);

  const value = useMemo<ConverterValue>(
    () => ({
      from: state.from,
      to: state.to,
      amount: state.amount,
      days: state.days,
      setFrom,
      setTo,
      setAmount,
      setDays,
      swap,
      favorites,
      isFavorite,
      saveFavorite,
      removeFavorite,
      reorderFavorite,
      history,
      recordHistory,
      clearHistory,
    }),
    [
      state,
      setFrom,
      setTo,
      setAmount,
      setDays,
      swap,
      favorites,
      isFavorite,
      saveFavorite,
      removeFavorite,
      reorderFavorite,
      history,
      recordHistory,
      clearHistory,
    ],
  );

  return <ConverterContext.Provider value={value}>{children}</ConverterContext.Provider>;
}

export function useConverter(): ConverterValue {
  const context = useContext(ConverterContext);
  if (!context) throw new Error("useConverter must be used within ConverterProvider");
  return context;
}

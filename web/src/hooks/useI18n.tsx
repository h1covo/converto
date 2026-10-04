import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isLang,
  translate,
  type Lang,
  type TranslationKey,
  type TranslationParams,
} from "../lib/i18n";
import { setUrlParams } from "../lib/url";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const LANG_KEY = "cc-lang";

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl && isLang(fromUrl)) return fromUrl;
  const stored = window.localStorage.getItem(LANG_KEY);
  if (stored && isLang(stored)) return stored;
  return "zh";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(LANG_KEY, next);
    setUrlParams({ lang: next === "zh" ? null : next });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(lang, key, params),
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, toggleLang: () => setLang(lang === "zh" ? "en" : "zh"), t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

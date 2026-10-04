import { useEffect } from "react";
import ConverterCard from "./components/ConverterCard";
import CrossMatrix from "./components/CrossMatrix";
import CurrencyBoard from "./components/CurrencyBoard";
import HistoryList from "./components/HistoryList";
import LangToggle from "./components/LangToggle";
import MarketLab from "./components/MarketLab";
import MarketStats from "./components/MarketStats";
import RateTrendChart from "./components/RateTrendChart";
import ThemeToggle from "./components/ThemeToggle";
import { useI18n } from "./hooks/useI18n";

export default function App() {
  const { t, lang } = useI18n();

  useEffect(() => {
    document.title = t("app.title");
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [t, lang]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {t("app.title")}
        </h1>
        <div className="flex shrink-0 gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-col gap-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <ConverterCard />
          <div className="flex flex-col gap-5">
            <RateTrendChart />
            <MarketStats className="flex-1" />
          </div>
        </div>
        <CurrencyBoard />
        <CrossMatrix />
        <MarketLab />
        <HistoryList />
      </main>

      <footer className="mt-8 flex w-full flex-col items-center gap-3 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        <p className="text-center">{t("footer")}</p>
        <span className="wm wm--footer" aria-hidden="true">
          h1<span className="wm__x">×</span>
        </span>
      </footer>

      <span className="wm--ring wm--badge" aria-hidden="true">
        <span className="wm">
          h1<span className="wm__x">×</span>
        </span>
      </span>
    </div>
  );
}

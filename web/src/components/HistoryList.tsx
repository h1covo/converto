import { useConverter } from "../hooks/useConverter";
import { useI18n } from "../hooks/useI18n";

export default function HistoryList() {
  const { history, setFrom, setTo, setAmount, clearHistory } = useConverter();
  const { lang, t } = useI18n();

  function restore(entry: (typeof history)[number]) {
    setFrom(entry.from);
    setTo(entry.to);
    setAmount(entry.amount);
  }

  return (
    <section className="panel panel-pad">
      <div className="section-head">
        <h2 className="section-title">{t("history.title")}</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="rounded-md px-2 py-1 text-xs font-semibold tracking-wide text-muted transition hover:bg-surface-2 hover:text-up"
          >
            {t("history.clear")}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("history.empty")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {history.map((entry) => (
            <li key={`${entry.from}-${entry.to}-${entry.amount}-${entry.at}`}>
              <button
                type="button"
                onClick={() => restore(entry)}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm transition hover:text-accent"
              >
                <span>
                  <span className="font-semibold tabular-nums">{entry.amount}</span> {entry.from}{" "}
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>{" "}
                  <span className="font-semibold">{entry.to}</span>
                </span>
                <span className="text-xs text-muted">
                  {new Date(entry.at).toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

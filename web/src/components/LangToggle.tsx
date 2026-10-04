import { useI18n } from "../hooks/useI18n";

export default function LangToggle() {
  const { lang, toggleLang, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={t("lang.toggleAria")}
      aria-label={t("lang.toggleAria")}
      className="chip text-sm font-medium text-muted hover:text-ink"
    >
      {lang === "zh" ? "EN" : "中文"}
    </button>
  );
}

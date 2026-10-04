import { useI18n } from "../hooks/useI18n";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const label = theme === "light" ? t("theme.light") : t("theme.dark");
  const icon = theme === "light" ? "☀" : "☾";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={t("theme.toggleAria")}
      aria-label={t("theme.toggleAria")}
      className="chip inline-flex items-center gap-1.5 text-muted hover:text-ink"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

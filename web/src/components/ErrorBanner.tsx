import { useI18n } from "../hooks/useI18n";

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { t } = useI18n();

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl bg-up/5 px-4 py-3 ring-1 ring-up/25">
      <p className="text-sm text-up">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-up px-3 py-1.5 text-sm font-semibold text-paper transition hover:opacity-90 active:scale-95"
      >
        {t("error.retry")}
      </button>
    </div>
  );
}

import type { RateErrorCode } from "../api/client";
import { useI18n } from "../hooks/useI18n";
import { formatRate, invertRate } from "../lib/convert";
import { errorKeyForCode } from "../lib/errors";
import CopyButton from "./CopyButton";

interface RateInfoProps {
  from: string;
  to: string;
  rate: string;
  date: string;
  fetchedAt: number;
  stale: boolean;
  error: RateErrorCode | null;
  onRetry: () => void;
}

export default function RateInfo({
  from,
  to,
  rate,
  date,
  fetchedAt,
  stale,
  error,
  onRetry,
}: RateInfoProps) {
  const { lang, t } = useI18n();
  const time = new Date(fetchedAt).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const rateLine = `1 ${from} = ${formatRate(rate)} ${to}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-sm font-semibold tracking-tight">{rateLine}</span>
        <CopyButton text={rateLine} label={t("rate.copy")} className="btn-icon">
          {t("rate.copy")}
        </CopyButton>
        {stale && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-ink">
            {t("trend.stale")}
          </span>
        )}
      </div>

      <p className="micro">
        1 {to} = {formatRate(invertRate(rate))} {from}
      </p>

      <p className="micro">{t("rate.meta", { date, time })}</p>

      {error && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-accent underline-offset-2 hover:underline"
        >
          {t(errorKeyForCode(error))} · {t("error.retry")}
        </button>
      )}
    </div>
  );
}

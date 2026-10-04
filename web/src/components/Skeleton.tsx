import { useI18n } from "../hooks/useI18n";

interface SkeletonProps {
  lines?: number;
}

export default function Skeleton({ lines = 2 }: SkeletonProps) {
  const { t } = useI18n();

  return (
    <div className="w-full animate-pulse space-y-3" role="status" aria-label={t("loading.rates")}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`rounded-md bg-surface-2 ${index === 0 ? "h-8 w-2/3" : "h-4 w-1/2"}`}
        />
      ))}
    </div>
  );
}

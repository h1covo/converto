import { useId, useMemo } from "react";
import { buildTrendGeometry } from "../lib/trend";

interface SparklineProps {
  values: string[];
  className?: string;
}

export default function Sparkline({ values, className = "" }: SparklineProps) {
  const gradientId = useId();
  const geometry = useMemo(
    () =>
      buildTrendGeometry(
        values.map((rate, index) => ({ date: String(index), rate })),
        120,
        30,
        2,
      ),
    [values],
  );

  if (values.length < 2 || geometry.coords.length === 0) return null;

  const up = geometry.changePct >= 0;

  return (
    <svg
      viewBox="0 0 120 30"
      preserveAspectRatio="none"
      className={`h-7 w-full ${up ? "text-up" : "text-down"} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
      <path
        d={geometry.linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

import { useState } from "react";
import { useI18n } from "../hooks/useI18n";

interface SwapButtonProps {
  onClick: () => void;
}

export default function SwapButton({ onClick }: SwapButtonProps) {
  const { t } = useI18n();
  const [spin, setSpin] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setSpin((value) => !value);
        onClick();
      }}
      aria-label={t("swap.aria")}
      title={t("swap.aria")}
      className="mt-6 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-accent hover:text-accent active:scale-95"
    >
      <span
        aria-hidden="true"
        className={`text-lg leading-none transition-transform duration-300 ${spin ? "rotate-180" : ""}`}
      >
        ⇄
      </span>
    </button>
  );
}

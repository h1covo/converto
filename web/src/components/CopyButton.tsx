import { useState, type ReactNode } from "react";
import { useI18n } from "../hooks/useI18n";

interface CopyButtonProps {
  text: string;
  label: string;
  className?: string;
  children?: ReactNode;
}

function fallbackCopy(text: string): void {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
}

export default function CopyButton({ text, label, className, children }: CopyButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 复制失败时忽略（例如非安全上下文）
    }
  }

  return (
    <button type="button" onClick={copy} title={label} aria-label={label} className={className}>
      {copied ? t("copy.copied") : (children ?? label)}
    </button>
  );
}

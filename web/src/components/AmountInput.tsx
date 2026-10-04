import { useI18n } from "../hooks/useI18n";
import { normalizeAmountInput } from "../lib/convert";

interface AmountInputProps {
  value: string;
  symbol: string;
  error: string | null;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

export default function AmountInput({ value, symbol, error, onChange, onEnter }: AmountInputProps) {
  const { t } = useI18n();
  const inputId = "amount";
  const errorId = "amount-error";

  return (
    <div>
      <label htmlFor={inputId} className="label mb-1.5 block">
        {t("amount.label")}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition ${
          error ? "border-up" : "border-line focus-within:ring-2 focus-within:ring-accent"
        }`}
      >
        <span className="select-none rounded-lg bg-surface-2 px-2 py-1 text-sm font-semibold text-muted">
          {symbol}
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("amount.placeholder")}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(normalizeAmountInput(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") onEnter?.();
          }}
          className="w-full bg-transparent py-3 text-3xl font-extrabold tracking-tight outline-none placeholder:font-medium placeholder:text-muted/40"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-up">
          {error}
        </p>
      )}
    </div>
  );
}

interface StarIconProps {
  filled: boolean;
  size?: number;
  className?: string;
}

export function StarIcon({ filled, size = 16, className = "" }: StarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85z" />
    </svg>
  );
}

interface StarButtonProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  size?: number;
  className?: string;
}

export function StarButton({ active, onToggle, label, size = 15, className = "" }: StarButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid shrink-0 place-items-center rounded-lg border transition active:scale-90 ${
        active
          ? "border-amber-300 bg-amber-50 text-amber-500 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
          : "border-transparent text-muted/45 hover:border-line hover:bg-surface-2 hover:text-amber-500"
      } ${className}`}
    >
      <StarIcon filled={active} size={size} />
    </button>
  );
}

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useConverter } from "../hooks/useConverter";
import { useI18n } from "../hooks/useI18n";
import type { CurrencyCode } from "../lib/currencies";
import type { FavPair } from "../lib/storage";
import { StarIcon } from "./Star";

const PRESETS: Array<[CurrencyCode, CurrencyCode]> = [
  ["USD", "CNY"],
  ["EUR", "CNY"],
  ["USD", "JPY"],
  ["GBP", "CNY"],
  ["HKD", "CNY"],
  ["AUD", "CNY"],
];

export default function QuickPairs() {
  const { from, to, setFrom, setTo, favorites, removeFavorite, reorderFavorite } = useConverter();
  const { t } = useI18n();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const reorderRef = useRef(reorderFavorite);
  reorderRef.current = reorderFavorite;

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const index = dragIndexRef.current;
      const container = listRef.current;
      if (index == null || !container) return;
      const chips = Array.from(container.querySelectorAll<HTMLElement>("[data-chip]"));
      let target = index;
      let best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < chips.length; i++) {
        const rect = chips[i].getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (inside) {
          target = i;
          break;
        }
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = dx * dx + dy * dy;
        if (distance < best) {
          best = distance;
          target = i;
        }
      }
      if (target !== index) {
        reorderRef.current(index, target);
        dragIndexRef.current = target;
        setDragIndex(target);
      }
    }
    function onUp() {
      dragIndexRef.current = null;
      setDragIndex(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const presetPairs = PRESETS.filter(
    ([f, target]) => !favorites.some((pair) => pair.from === f && pair.to === target),
  );

  function select(pair: FavPair) {
    setFrom(pair.from);
    setTo(pair.to);
  }

  function startDrag(event: ReactPointerEvent, index: number) {
    event.preventDefault();
    dragIndexRef.current = index;
    setDragIndex(index);
  }

  function chipClass(active: boolean) {
    return `chip inline-flex items-center gap-1.5 ${active ? "chip--on font-medium" : "text-muted"}`;
  }

  return (
    <div className="space-y-4">
      {favorites.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">{t("favorites.label")}</p>
          <div ref={listRef} className="flex flex-wrap gap-2">
            {favorites.map((pair, index) => {
              const active = pair.from === from && pair.to === to;
              const dragging = dragIndex === index;
              return (
                <span
                  key={`fav-${pair.from}-${pair.to}`}
                  data-chip
                  className={`${chipClass(active)} ${dragging ? "opacity-60 ring-2 ring-accent" : ""}`}
                >
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={t("fav.reorder")}
                    title={t("fav.reorder")}
                    onPointerDown={(event) => startDrag(event, index)}
                    style={{ touchAction: "none" }}
                    className={`cursor-grab select-none pr-0.5 ${
                      dragging ? "cursor-grabbing" : ""
                    } text-muted/70`}
                  >
                    ⠿
                  </span>
                  <button
                    type="button"
                    onClick={() => select(pair)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <StarIcon filled size={12} className="text-amber-500" />
                    {pair.from} {pair.to}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(pair)}
                    aria-label={t("fav.remove")}
                    className="text-muted transition hover:text-up"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted">{t("pairs.title")}</p>
        <div className="flex flex-wrap gap-2">
          {presetPairs.map(([f, target]) => (
            <button
              key={`${f}-${target}`}
              type="button"
              onClick={() => select({ from: f, to: target })}
              className={chipClass(f === from && target === to)}
            >
              {f} {target}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

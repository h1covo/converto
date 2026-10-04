import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { setUrlParams } from "../lib/url";

export type Theme = "light" | "dark";

const THEME_KEY = "cc-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function initialTheme(): Theme {
  const fromUrl = new URLSearchParams(window.location.search).get("theme");
  if (isTheme(fromUrl)) return fromUrl;
  const stored = window.localStorage.getItem(THEME_KEY);
  if (isTheme(stored)) return stored;
  return "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_KEY, next);
    setUrlParams({ theme: next });

    const root = document.documentElement;
    const commit = () => {
      applyTheme(next);
      // flushSync 确保 DOM 在 View Transition 截取「新」快照前已更新
      flushSync(() => setThemeState(next));
    };

    const doc = document as ViewTransitionDocument;
    // 换肤瞬间禁用逐元素过渡（金额/币种输入框等自带的 transition 会先于整页跳变），
    // 整页统一交给 View Transition 交叉溶解
    root.classList.add("theme-switching");
    if (doc.startViewTransition && !prefersReducedMotion()) {
      const transition = doc.startViewTransition(commit);
      transition.finished.finally(() => root.classList.remove("theme-switching"));
      window.setTimeout(() => root.classList.remove("theme-switching"), 800);
    } else {
      commit();
      window.setTimeout(() => root.classList.remove("theme-switching"), 80);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}

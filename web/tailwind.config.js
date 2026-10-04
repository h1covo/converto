/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        up: "rgb(var(--up) / <alpha-value>)",
        down: "rgb(var(--down) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        board: "rgb(var(--board-bg) / <alpha-value>)",
        "board-ink": "rgb(var(--board-ink) / <alpha-value>)",
        "board-muted": "rgb(var(--board-muted) / <alpha-value>)",
        "board-accent": "rgb(var(--board-accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(16 36 31 / 0.04), 0 12px 30px -20px rgb(16 36 31 / 0.35)",
        lift: "0 2px 6px rgb(16 36 31 / 0.08), 0 24px 48px -24px rgb(16 36 31 / 0.40)",
      },
      keyframes: {
        valueIn: {
          "0%": { opacity: "0", transform: "translateY(7px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sheetIn: {
          "0%": { opacity: "0", transform: "translateY(-5px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        valueIn: "valueIn 0.28s cubic-bezier(0.2, 0.7, 0.2, 1)",
        sheetIn: "sheetIn 0.16s cubic-bezier(0.2, 0.7, 0.2, 1)",
        pop: "pop 0.34s ease-out",
      },
    },
  },
  plugins: [],
};

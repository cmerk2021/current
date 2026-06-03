import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePreferences } from "@/lib/preferences";
import type { Accent, Density, Theme } from "@/lib/pb";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  accent: Accent;
  density: Density;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const prefs = usePreferences();
  const theme = prefs.data?.theme ?? "system";
  const accent = prefs.data?.accent ?? "indigo";
  const density = prefs.data?.density ?? "comfortable";

  const resolvedTheme = useMemo(() => resolve(theme), [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.accent = accent;
    root.dataset.density = density;
  }, [resolvedTheme, accent, density]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, accent, density }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

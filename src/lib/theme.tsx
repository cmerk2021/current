import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { readUI, usePreferences } from "@/lib/preferences";
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
  if (theme === "amoled") return "dark";
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const prefs = usePreferences();
  const theme = prefs.data?.theme ?? "system";
  const accent = prefs.data?.accent ?? "indigo";
  const density = prefs.data?.density ?? "comfortable";
  const ui = readUI(prefs.data);

  const resolvedTheme = useMemo(() => resolve(theme), [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.theme = theme;
    root.dataset.accent = accent;
    root.dataset.density = density;
    root.dataset.radius = ui.radius ?? "medium";
    root.dataset.font = ui.fontFamily ?? "system";
    root.dataset.fontsize = ui.fontSize ?? "medium";
    root.dataset.motion = ui.reducedMotion ? "reduced" : "normal";

    // Custom accent override
    if (ui.customAccent) {
      try {
        const hsl = hexToHsl(ui.customAccent);
        if (hsl) {
          root.style.setProperty("--primary", hsl);
          root.style.setProperty("--ring", hsl);
        }
      } catch {
        // ignore bad hex
      }
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }
  }, [resolvedTheme, theme, accent, density, ui.radius, ui.fontFamily, ui.fontSize, ui.reducedMotion, ui.customAccent]);

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

function hexToHsl(hex: string): string | null {
  const m = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

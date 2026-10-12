"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "mwt_dashboard_theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialize from localStorage on client, default "dark" for SSR match
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      setThemeState(event.newValue === "light" ? "light" : "dark");
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback(
    (next) => {
      const value = typeof next === "function" ? next(theme) : next;
      setThemeState(value);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, value);
      } catch {
        // ignore
      }
    },
    [theme],
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

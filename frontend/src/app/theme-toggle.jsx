"use client";

import { useMemo } from "react";
import { useTheme } from "./theme-context";

export default function ThemeToggle({ className = "", buttonClassName = "", labelClassName = "" }) {
  const { theme, setTheme, mounted } = useTheme();

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  // Only show the correct label after mount to avoid hydration mismatch
  const label = useMemo(() => {
    if (!mounted) return "Tema";
    return theme === "dark" ? "Oscuro" : "Claro";
  }, [theme, mounted]);

  return (
    <div className={className}>
      <span className={labelClassName}>Modo</span>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Cambiar tema visual"
        className={buttonClassName}
        suppressHydrationWarning
      >
        {label}
      </button>
    </div>
  );
}

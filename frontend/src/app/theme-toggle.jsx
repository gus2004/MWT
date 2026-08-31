"use client";

import { useMemo } from "react";
import { useTheme } from "./theme-context";

export default function ThemeToggle({ className = "", buttonClassName = "", labelClassName = "" }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const label = useMemo(() => (theme === "dark" ? "Oscuro" : "Claro"), [theme]);

  return (
    <div className={className}>
      <span className={labelClassName}>Modo</span>
      <button type="button" onClick={toggleTheme} aria-label="Cambiar tema visual" className={buttonClassName}>
        {label}
      </button>
    </div>
  );
}
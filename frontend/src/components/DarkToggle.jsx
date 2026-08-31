"use client";
import { useEffect, useState } from "react";

export default function DarkToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <button onClick={toggle} aria-label="Toggle dark mode" style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent" }}>
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

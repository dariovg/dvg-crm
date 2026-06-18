"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dvg-crm-theme";

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
    return saved;
  }
  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} title="Modo oscuro">
      {theme === "dark" ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}

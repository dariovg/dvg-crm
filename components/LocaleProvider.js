"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, LOCALE_STORAGE_KEY, t as translate } from "@/lib/i18n";

const LocaleContext = createContext({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key, vars) => translate(key, defaultLocale, vars),
});

export function useLocale() {
  return useContext(LocaleContext);
}

function readStoredLocale() {
  if (typeof window === "undefined") return defaultLocale;
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return defaultLocale;
}

export function applyLocale(locale) {
  document.documentElement.setAttribute("lang", locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export default function LocaleProvider({ children }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    applyLocale(stored);
    setMounted(true);

    function onStorage(e) {
      if (e.key === LOCALE_STORAGE_KEY && (e.newValue === "es" || e.newValue === "en")) {
        setLocaleState(e.newValue);
        document.documentElement.setAttribute("lang", e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLocale = useCallback(
    (next) => {
      if (next !== "es" && next !== "en") return;
      setLocaleState(next);
      applyLocale(next);
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key, vars) => translate(key, mounted ? locale : defaultLocale, vars),
    [locale, mounted]
  );

  return (
    <LocaleContext.Provider value={{ locale: mounted ? locale : defaultLocale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

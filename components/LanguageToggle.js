"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LanguageToggle({ className = "", compact = false }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={`language-toggle${compact ? " language-toggle--compact" : ""} ${className}`.trim()}
      role="group"
      aria-label={t("locale.label")}
    >
      <button
        type="button"
        className={`language-toggle-btn${locale === "es" ? " language-toggle-btn--active" : ""}`}
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
        title={t("locale.spanish")}
      >
        ES
      </button>
      <button
        type="button"
        className={`language-toggle-btn${locale === "en" ? " language-toggle-btn--active" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        title={t("locale.english")}
      >
        EN
      </button>
    </div>
  );
}

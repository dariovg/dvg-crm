"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getHelpForPath } from "@/lib/help-content";
import { useLocale } from "@/components/LocaleProvider";

export default function HelpButton() {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const help = getHelpForPath(pathname, locale);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="help-btn-wrap" ref={wrapRef}>
      <button
        type="button"
        className="help-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("help.title")}
        aria-expanded={open}
        title={t("help.title")}
      >
        ?
      </button>
      {open && (
        <div className="help-panel" role="dialog" aria-label={help.title}>
          <div className="help-panel-head">
            <strong>{help.title}</strong>
            <button
              type="button"
              className="btn-sm btn-ghost"
              onClick={() => setOpen(false)}
            >
              {t("common.close")}
            </button>
          </div>
          {help.tips?.length ? (
            <ul className="help-tips">
              {help.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="help-empty">{t("help.noContent")}</p>
          )}
        </div>
      )}
    </div>
  );
}

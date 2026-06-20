"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { getOnboardingForRole, onboardingStorageKey } from "@/lib/onboarding-content";
import { useLocale } from "@/components/LocaleProvider";

function readState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export default function OnboardingChecklist() {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const config = getOnboardingForRole(role, locale);

  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (!userId || !config) return;
    const key = onboardingStorageKey(userId);
    const saved = readState(key);
    if (saved?.dismissed) {
      setVisible(false);
      setChecked(saved.checked || []);
      return;
    }
    setChecked(saved?.checked || []);
    setVisible(true);
  }, [userId, config]);

  const persist = useCallback(
    (next) => {
      if (!userId) return;
      writeState(onboardingStorageKey(userId), next);
    },
    [userId]
  );

  function toggleStep(stepId) {
    setChecked((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId];
      persist({ dismissed: false, checked: next });
      return next;
    });
  }

  function dismiss() {
    persist({ dismissed: true, checked });
    setVisible(false);
  }

  if (!visible || !config) return null;

  const total = config.steps.length;
  const done = config.steps.filter((s) => checked.includes(s.id)).length;

  return (
    <div className="onboarding-card" role="region" aria-label={config.title}>
      <div className="onboarding-card-head">
        <div>
          <strong>{config.title}</strong>
          <span className="onboarding-progress">
            {t("onboarding.progress", { done, total })}
          </span>
        </div>
        <button type="button" className="btn-sm btn-ghost" onClick={dismiss}>
          {t("onboarding.dismiss")}
        </button>
      </div>
      <ul className="onboarding-steps">
        {config.steps.map((step) => {
          const isDone = checked.includes(step.id);
          return (
            <li key={step.id} className={isDone ? "onboarding-step--done" : ""}>
              <label className="onboarding-step-label">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleStep(step.id)}
                />
                <span>{step.label}</span>
              </label>
              {step.href && (
                <Link href={step.href} className="onboarding-step-link">
                  {t("common.go")}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

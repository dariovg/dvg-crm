"use client";

import { useState, useTransition } from "react";
import { saveCrmSettings } from "@/app/actions";

export default function CrmSettingsForm({ initial }) {
  const [inactivityDays, setInactivityDays] = useState(String(initial.inactivityDays));
  const [rules, setRules] = useState(initial.scoringRules);
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  function updateSource(key, value) {
    setRules((r) => ({
      ...r,
      source: { ...r.source, [key]: parseInt(value, 10) || 0 },
    }));
  }

  function updateStatus(key, value) {
    setRules((r) => ({
      ...r,
      status: { ...r.status, [key]: parseInt(value, 10) || 0 },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await saveCrmSettings({ inactivityDays, scoringRules: rules });
        setMessage({ type: "ok", text: "Configuración guardada." });
      } catch (err) {
        setMessage({ type: "err", text: err.message || "Error al guardar." });
      }
    });
  }

  return (
    <form className="card crm-settings-form" onSubmit={handleSubmit}>
      <h2>Recordatorios por inactividad</h2>
      <div className="field field--narrow">
        <label>Días sin actividad antes de alertar</label>
        <input
          type="number"
          min={1}
          max={90}
          value={inactivityDays}
          onChange={(e) => setInactivityDays(e.target.value)}
        />
      </div>

      <h2>Puntuación de leads</h2>
      <p className="page-lead">Pesos por origen</p>
      <div className="crm-settings-grid">
        {Object.entries(rules.source).map(([key, val]) => (
          <div key={key} className="field">
            <label>{key}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => updateSource(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <p className="page-lead">Pesos por estado</p>
      <div className="crm-settings-grid">
        {Object.entries(rules.status).map(([key, val]) => (
          <div key={key} className="field">
            <label>{key}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => updateStatus(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="crm-settings-grid">
        <div className="field">
          <label>Bonus con presupuesto</label>
          <input
            type="number"
            value={rules.hasQuote}
            onChange={(e) =>
              setRules((r) => ({ ...r, hasQuote: parseInt(e.target.value, 10) || 0 }))
            }
          />
        </div>
        <div className="field">
          <label>Bonus con cita</label>
          <input
            type="number"
            value={rules.hasMeeting}
            onChange={(e) =>
              setRules((r) => ({ ...r, hasMeeting: parseInt(e.target.value, 10) || 0 }))
            }
          />
        </div>
        <div className="field">
          <label>Bonus actividad reciente</label>
          <input
            type="number"
            value={rules.recentActivityBonus}
            onChange={(e) =>
              setRules((r) => ({
                ...r,
                recentActivityBonus: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
        <div className="field">
          <label>Penalización inactividad</label>
          <input
            type="number"
            value={rules.staleActivityPenalty}
            onChange={(e) =>
              setRules((r) => ({
                ...r,
                staleActivityPenalty: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
      </div>

      {message && (
        <p className={message.type === "ok" ? "form-success" : "form-error"}>
          {message.text}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { globalSearch } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ contacts: [], tasks: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runSearch = useCallback(async (term) => {
    if (term.length < 2) {
      setResults({ contacts: [], tasks: [] });
      return;
    }
    setLoading(true);
    const data = await globalSearch(term);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(q), 200);
    return () => clearTimeout(t);
  }, [q, open, runSearch]);

  if (!open) {
    return (
      <button
        type="button"
        className="global-search-trigger"
        onClick={() => setOpen(true)}
        title="Buscar (Cmd+K)"
        aria-label="Buscar"
      >
        <span className="global-search-label">Buscar…</span>
        <kbd className="global-search-kbd">⌘K</kbd>
        <svg className="global-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="search-overlay" onClick={() => setOpen(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="search-modal-input"
          placeholder="Buscar leads, emails, tareas…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {loading && <p className="search-hint">Buscando…</p>}
        {!loading && q.length >= 2 && !results.contacts.length && !results.tasks.length && (
          <p className="search-hint">Sin resultados</p>
        )}
        {results.contacts.length > 0 && (
          <div className="search-group">
            <h3>Leads</h3>
            {results.contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                className="search-item"
                onClick={() => {
                  setOpen(false);
                  router.push(`/leads/${c.id}`);
                }}
              >
                <strong>{c.name}</strong>
                <span>{c.email}</span>
                <StatusBadge status={c.status} />
              </button>
            ))}
          </div>
        )}
        {results.tasks.length > 0 && (
          <div className="search-group">
            <h3>Tareas</h3>
            {results.tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className="search-item"
                onClick={() => {
                  setOpen(false);
                  router.push(`/leads/${t.contactId}`);
                }}
              >
                <strong>{t.title}</strong>
                <span>{t.contact.name}</span>
              </button>
            ))}
          </div>
        )}
        <p className="search-foot">Esc para cerrar</p>
      </div>
    </div>
  );
}

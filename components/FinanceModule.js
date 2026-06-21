"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  createFinanceEntry,
  deleteFinanceEntry,
} from "@/app/actions";
import { formatEuro } from "@/lib/pricing-catalog";

function entryTypeLabel(type) {
  return type === "INCOME" ? "Ingreso" : "Gasto";
}

function FinanceEntryForm({ categories, defaultType, onDone }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const typeCategories = categories.filter((c) => c.type === defaultType);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.target);
    try {
      await createFinanceEntry({
        type: defaultType,
        amount: fd.get("amount"),
        entryDate: fd.get("entryDate"),
        categoryId: fd.get("categoryId"),
        description: fd.get("description"),
        recurring: fd.get("recurring") === "on",
        attachmentUrl: fd.get("attachmentUrl"),
      });
      e.target.reset();
      onDone?.();
    } catch (err) {
      setError(err.message || "Error al guardar");
    }
    setPending(false);
  }

  return (
    <form className="finance-entry-form" onSubmit={onSubmit}>
      <div className="field">
        <label>Importe (EUR, IVA incl.)</label>
        <input name="amount" type="number" step="0.01" min="0" required placeholder="0,00" />
      </div>
      <div className="field">
        <label>Fecha</label>
        <input
          name="entryDate"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <div className="field">
        <label>Categoría</label>
        <select name="categoryId" required defaultValue={typeCategories[0]?.id || ""}>
          {typeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Descripción</label>
        <input name="description" type="text" placeholder="Opcional" />
      </div>
      <div className="field">
        <label>URL adjunto (factura)</label>
        <input name="attachmentUrl" type="url" placeholder="https://…" />
      </div>
      {defaultType === "INCOME" && (
        <label className="checkbox-row">
          <input name="recurring" type="checkbox" />
          Ingreso recurrente (mensual)
        </label>
      )}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        Registrar {entryTypeLabel(defaultType).toLowerCase()}
      </button>
    </form>
  );
}

function FinanceChart({ monthly, maxBar }) {
  if (!monthly.length) {
    return <p className="muted">Sin movimientos todavía.</p>;
  }

  return (
    <div className="finance-chart">
      {monthly.map((m) => (
        <div key={m.key} className="finance-chart-col">
          <div className="finance-chart-bars">
            <div
              className="finance-bar finance-bar--income"
              style={{ height: `${Math.max(4, (m.income / maxBar) * 100)}%` }}
              title={`Ingresos: ${formatEuro(m.income)}`}
            />
            <div
              className="finance-bar finance-bar--expense"
              style={{ height: `${Math.max(4, (m.expense / maxBar) * 100)}%` }}
              title={`Gastos: ${formatEuro(m.expense)}`}
            />
          </div>
          <span className="finance-chart-label">{m.label}</span>
          <span className={`finance-chart-net${m.net < 0 ? " finance-chart-net--neg" : ""}`}>
            {formatEuro(m.net)}
          </span>
        </div>
      ))}
      <div className="finance-chart-legend">
        <span><i className="finance-legend-dot finance-legend-dot--income" /> Ingresos</span>
        <span><i className="finance-legend-dot finance-legend-dot--expense" /> Gastos</span>
      </div>
    </div>
  );
}

export default function FinanceModule({
  categories,
  entries,
  stats,
  filterMonth,
  monthOptions,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    router.refresh();
  }

  function onMonthChange(e) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("month", value);
    else params.delete("month");
    router.push(`/ceo/finanzas?${params.toString()}`);
  }

  async function onDelete(id) {
    if (!window.confirm("¿Eliminar este movimiento?")) return;
    setBusyId(id);
    try {
      await deleteFinanceEntry(id);
      refresh();
    } catch (err) {
      alert(err.message);
    }
    setBusyId(null);
  }

  return (
    <>
      <div className="ceo-kpi-grid">
        <div className="ceo-kpi-card">
          <span className="ceo-kpi-label">Ingresos</span>
          <strong className="ceo-kpi-value">{formatEuro(stats.totalIncome)}</strong>
        </div>
        <div className="ceo-kpi-card">
          <span className="ceo-kpi-label">Gastos</span>
          <strong className="ceo-kpi-value">{formatEuro(stats.totalExpense)}</strong>
        </div>
        <div className={`ceo-kpi-card${stats.net < 0 ? " ceo-kpi-card--warn" : ""}`}>
          <span className="ceo-kpi-label">Neto</span>
          <strong className="ceo-kpi-value">{formatEuro(stats.net)}</strong>
        </div>
      </div>

      <div className="panel finance-chart-panel">
        <h3 className="panel-title">Evolución mensual</h3>
        <FinanceChart monthly={stats.monthly} maxBar={stats.maxBar} />
      </div>

      <div className="ceo-two-col">
        <div className="card">
          <h2>Nuevo gasto</h2>
          <FinanceEntryForm categories={categories} defaultType="EXPENSE" onDone={refresh} />
        </div>
        <div className="card">
          <h2>Nuevo ingreso</h2>
          <FinanceEntryForm categories={categories} defaultType="INCOME" onDone={refresh} />
        </div>
      </div>

      <div className="panel">
        <div className="finance-list-head">
          <h3 className="panel-title">Movimientos</h3>
          <div className="field finance-month-filter">
            <label>Mes</label>
            <select value={filterMonth || ""} onChange={onMonthChange}>
              <option value="">Todos</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Importe</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length ? (
                entries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.entryDate).toLocaleDateString("es-ES")}</td>
                    <td>
                      <span className={`finance-type-pill finance-type-pill--${e.type.toLowerCase()}`}>
                        {entryTypeLabel(e.type)}
                      </span>
                      {e.recurring && <span className="finance-recurring">↻</span>}
                    </td>
                    <td>{e.category.name}</td>
                    <td>{formatEuro(e.amount)}</td>
                    <td>
                      {e.description || "—"}
                      {e.quote && (
                        <>
                          {" "}
                          <Link href={`/presupuestos/${e.quote.id}`} className="text-link">
                            {e.quote.number}
                          </Link>
                        </>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-link-sm btn-link-danger"
                        disabled={busyId === e.id}
                        onClick={() => onDelete(e.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin movimientos{filterMonth ? ` en ${filterMonth}` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

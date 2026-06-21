"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createEmployeeProfile,
  updateEmployeeProfile,
  deleteEmployeeProfile,
} from "@/app/actions";
import { formatEuro } from "@/lib/pricing-catalog";

const CONTRACT_TYPES = [
  { id: "", label: "—" },
  { id: "INDEFINIDO", label: "Indefinido" },
  { id: "TEMPORAL", label: "Temporal" },
  { id: "FREELANCE", label: "Freelance" },
  { id: "PRACTICAS", label: "Prácticas" },
];

function centsToEuroInput(cents) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function EmployeeForm({ users, employee, onCancel, onDone }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.target);
    const payload = {
      fullName: fd.get("fullName"),
      department: fd.get("department"),
      jobTitle: fd.get("jobTitle"),
      contractType: fd.get("contractType"),
      startDate: fd.get("startDate") || null,
      endDate: fd.get("endDate") || null,
      monthlyCost: fd.get("monthlyCost"),
      notes: fd.get("notes"),
      userId: fd.get("userId") || null,
      active: fd.get("active") === "on",
    };

    try {
      if (employee) {
        await updateEmployeeProfile(employee.id, payload);
      } else {
        await createEmployeeProfile(payload);
      }
      onDone?.();
    } catch (err) {
      setError(err.message || "Error al guardar");
    }
    setPending(false);
  }

  return (
    <form className="hr-employee-form" onSubmit={onSubmit}>
      <div className="field">
        <label>Nombre completo</label>
        <input name="fullName" required defaultValue={employee?.fullName || ""} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Departamento</label>
          <input name="department" defaultValue={employee?.department || ""} />
        </div>
        <div className="field">
          <label>Puesto</label>
          <input name="jobTitle" defaultValue={employee?.jobTitle || ""} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Tipo de contrato</label>
          <select name="contractType" defaultValue={employee?.contractType || ""}>
            {CONTRACT_TYPES.map((t) => (
              <option key={t.id || "none"} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Usuario App (opcional)</label>
          <select name="userId" defaultValue={employee?.userId || ""}>
            <option value="">Sin vincular</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Inicio</label>
          <input
            name="startDate"
            type="date"
            defaultValue={
              employee?.startDate
                ? new Date(employee.startDate).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
        <div className="field">
          <label>Fin</label>
          <input
            name="endDate"
            type="date"
            defaultValue={
              employee?.endDate
                ? new Date(employee.endDate).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
      </div>
      <div className="field">
        <label>Coste mensual (EUR)</label>
        <input
          name="monthlyCost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Opcional"
          defaultValue={centsToEuroInput(employee?.monthlyCost)}
        />
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea name="notes" rows={3} defaultValue={employee?.notes || ""} />
      </div>
      <label className="checkbox-row">
        <input name="active" type="checkbox" defaultChecked={employee?.active !== false} />
        Activo
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={pending}>
          {employee ? "Guardar cambios" : "Añadir empleado"}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default function HrModule({ employees, users }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const editing = employees.find((e) => e.id === editingId);

  function refresh() {
    setEditingId(null);
    setShowCreate(false);
    router.refresh();
  }

  async function onDelete(id, name) {
    if (!window.confirm(`¿Eliminar ficha de ${name}?`)) return;
    setBusyId(id);
    try {
      await deleteEmployeeProfile(id);
      refresh();
    } catch (err) {
      alert(err.message);
    }
    setBusyId(null);
  }

  const activeCount = employees.filter((e) => e.active).length;
  const monthlyCostTotal = employees
    .filter((e) => e.active && e.monthlyCost)
    .reduce((sum, e) => sum + e.monthlyCost, 0);

  return (
    <>
      <div className="ceo-kpi-grid">
        <div className="ceo-kpi-card">
          <span className="ceo-kpi-label">Empleados activos</span>
          <strong className="ceo-kpi-value">{activeCount}</strong>
        </div>
        <div className="ceo-kpi-card">
          <span className="ceo-kpi-label">Total en plantilla</span>
          <strong className="ceo-kpi-value">{employees.length}</strong>
        </div>
        <div className="ceo-kpi-card">
          <span className="ceo-kpi-label">Coste mensual (activos)</span>
          <strong className="ceo-kpi-value">{formatEuro(monthlyCostTotal)}</strong>
        </div>
      </div>

      {(showCreate || editing) && (
        <div className="card">
          <h2>{editing ? `Editar: ${editing.fullName}` : "Nuevo empleado"}</h2>
          <EmployeeForm
            users={users}
            employee={editing}
            onCancel={() => {
              setEditingId(null);
              setShowCreate(false);
            }}
            onDone={refresh}
          />
        </div>
      )}

      {!showCreate && !editing && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowCreate(true)}
        >
          Añadir empleado
        </button>
      )}

      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Departamento</th>
              <th>Puesto</th>
              <th>Contrato</th>
              <th>Inicio</th>
              <th>Coste/mes</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.length ? (
              employees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.fullName}</strong>
                    {e.user && (
                      <span className="muted hr-user-link"> · {e.user.email}</span>
                    )}
                  </td>
                  <td>{e.department || "—"}</td>
                  <td>{e.jobTitle || "—"}</td>
                  <td>{e.contractType || "—"}</td>
                  <td>
                    {e.startDate
                      ? new Date(e.startDate).toLocaleDateString("es-ES")
                      : "—"}
                  </td>
                  <td>{e.monthlyCost != null ? formatEuro(e.monthlyCost) : "—"}</td>
                  <td>
                    <span className={`hr-status-pill${e.active ? "" : " hr-status-pill--inactive"}`}>
                      {e.active ? "Activo" : "Baja"}
                    </span>
                  </td>
                  <td className="hr-actions">
                    <button
                      type="button"
                      className="btn-link-sm"
                      onClick={() => {
                        setShowCreate(false);
                        setEditingId(e.id);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-link-sm btn-link-danger"
                      disabled={busyId === e.id}
                      onClick={() => onDelete(e.id, e.fullName)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="muted">
                  Sin fichas de empleado. Añade la primera arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTeamUser, updateTeamUser } from "@/app/actions";

const ROLES = [
  { id: "MEMBER", label: "Equipo" },
  { id: "MANAGER", label: "Manager" },
];

export default function TeamUsersAdmin({ users }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.target);
    try {
      await createTeamUser({
        email: fd.get("email"),
        name: fd.get("name"),
        password: fd.get("password"),
        role: fd.get("role"),
      });
      e.target.reset();
      router.refresh();
    } catch (err) {
      setError(err.message || "Error al crear usuario");
    }
    setPending(false);
  }

  async function onRoleChange(userId, role) {
    await updateTeamUser(userId, { role });
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h2>Crear usuario</h2>
        <form onSubmit={onCreate} className="admin-user-form">
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" required />
          </div>
          <div className="field">
            <label>Nombre</label>
            <input name="name" />
          </div>
          <div className="field">
            <label>Contraseña temporal</label>
            <input name="password" type="password" required minLength={8} />
          </div>
          <div className="field">
            <label>Rol</label>
            <select name="role" defaultValue="MEMBER">
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            Crear usuario
          </button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "—"}</td>
                <td>{u.email}</td>
                <td>
                  {u.role === "ADMIN" ? (
                    <span className="role-pill role-pill--admin">Admin</span>
                  ) : (
                    <select
                      className="assign-select"
                      value={u.role}
                      onChange={(e) => onRoleChange(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  beginTotpSetup,
  confirmTotpSetup,
  disableTotp,
} from "@/app/actions";

export default function TwoFactorSetup({ enabled, mandatory = false }) {
  const router = useRouter();
  const { update } = useSession();
  const [secret, setSecret] = useState(null);
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError("");
    try {
      const data = await beginTotpSetup();
      setSecret(data.secret);
      setUri(data.uri);
    } catch (err) {
      setError(err.message || "No se pudo iniciar la configuración");
    }
    setPending(false);
  }

  async function confirm(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await confirmTotpSetup(code);
      await update();
      setSecret(null);
      router.refresh();
    } catch (err) {
      setError(err.message || "Código incorrecto");
    }
    setPending(false);
  }

  async function turnOff() {
    if (!confirm("¿Desactivar 2FA?")) return;
    try {
      await disableTotp();
      await update();
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo desactivar 2FA");
    }
  }

  if (enabled) {
    return (
      <div className="card">
        <h2>Autenticación en dos pasos</h2>
        <p className="alert-success">2FA activo en tu cuenta admin.</p>
        {mandatory ? (
          <p className="page-lead">
            Obligatorio para administradores. No se puede desactivar.
          </p>
        ) : (
          <button type="button" className="btn-sm btn-danger" onClick={turnOff}>
            Desactivar 2FA
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Autenticación en dos pasos</h2>
      {mandatory ? (
        <p className="alert-warning">
          Debes activar 2FA para usar el CRM como administrador.
        </p>
      ) : (
        <p>Protege el acceso admin con Google Authenticator o similar.</p>
      )}
      {!secret ? (
        <button type="button" className="btn-primary" onClick={start} disabled={pending}>
          Configurar 2FA
        </button>
      ) : (
        <form onSubmit={confirm}>
          <p>
            Escanea en tu app o introduce manualmente:
            <code className="totp-secret">{secret}</code>
          </p>
          {uri && (
            <p className="totp-uri">
              <a href={uri}>Abrir en app authenticator</a>
            </p>
          )}
          <div className="field">
            <label>Código de 6 dígitos</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            Activar 2FA
          </button>
        </form>
      )}
      {!secret && error && <p className="form-error">{error}</p>}
    </div>
  );
}

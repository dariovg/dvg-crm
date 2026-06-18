"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 7l9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ off }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 5c5.5 0 9.5 4.5 10 7-0.4 1.4-1.6 3.4-3.4 5.1M6.7 6.7C4.1 8.4 2.4 10.7 2 12c0.5 2.5 4.5 7 10 7 1.2 0 2.3-0.2 3.3-0.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      totp: totp.trim() || undefined,
      redirect: false,
    });

    if (result?.error) {
      setError(
        totp
          ? "Código 2FA incorrecto o credenciales inválidas."
          : "Email o contraseña incorrectos. Si tienes 2FA, introduce el código."
      );
      setLoading(false);
    } else if (result?.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow login-bg-glow--left" />
      <div className="login-bg-glow login-bg-glow--right" />

      <div className="login-layout">
        <aside className="login-hero">
          <p className="login-hero-tag">DVG Studio</p>
          <h2>
            Tu panel de <span className="brand-ia">ventas</span>
          </h2>
          <p className="login-hero-text">
            Leads, pipeline, tareas y seguimiento comercial en un solo lugar.
            Acceso exclusivo para el equipo.
          </p>
          <ul className="login-hero-list">
            <li>Pipeline visual en tiempo real</li>
            <li>Leads desde la web automáticos</li>
            <li>Exportación y gestión de tareas</li>
          </ul>
        </aside>

        <div className="login-card">
          <div className="login-card-head">
            <div className="login-logo">
              DVG <span className="brand-ia">CRM</span>
            </div>
            <p>Inicia sesión con tu cuenta corporativa</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <div className={`login-input-wrap${error ? " login-input-wrap--error" : ""}`}>
                <span className="login-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="info@dvgsstudio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <div className={`login-input-wrap${error ? " login-input-wrap--error" : ""}`}>
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <EyeIcon off={showPass} />
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="totp">Código 2FA (si está activo)</label>
              <div className="login-input-wrap">
                <input
                  id="totp"
                  type="text"
                  name="totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden />
                  Verificando…
                </>
              ) : (
                "Entrar al CRM"
              )}
            </button>
          </form>

          <p className="login-foot">
            <LockIcon /> Conexión cifrada · Acceso restringido
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          DVG <span className="brand-ia">CRM</span>
        </h1>
        <p>Acceso interno — inicia sesión con tu cuenta de Google autorizada.</p>
        <button type="button" className="btn-primary" onClick={() => signIn("google")}>
          Entrar con Google
        </button>
      </div>
    </div>
  );
}

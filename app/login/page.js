"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Error en login:", error);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          DVG <span className="brand-ia">CRM</span>
        </h1>
        <p>Acceso interno — inicia sesión con tu cuenta corporativa.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? "Conectando..." : "Entrar con Google"}
        </button>
      </div>
    </div>
  );
}

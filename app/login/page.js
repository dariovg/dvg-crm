"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log("Iniciando login con Google...");
      const result = await signIn("google", {
        redirect: true,
        callbackUrl: "/dashboard",
      });
      console.log("Resultado del login:", result);
    } catch (error) {
      console.error("Error en login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          DVG <span className="brand-ia">CRM</span>
        </h1>
        <p>Acceso interno — inicia sesión con tu cuenta de Google autorizada.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? "Conectando..." : "Entrar con Google"}
        </button>
        {loading && <p style={{ marginTop: "10px", fontSize: "12px" }}>Por favor espera...</p>}
      </div>
    </div>
  );
}

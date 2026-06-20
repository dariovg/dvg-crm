import { Suspense } from "react";
import MarketingConexionesPage from "./MarketingConexionesClient";

export default function ConexionesPage() {
  return (
    <Suspense fallback={<div className="page-pad"><p className="muted">Cargando…</p></div>}>
      <MarketingConexionesPage />
    </Suspense>
  );
}

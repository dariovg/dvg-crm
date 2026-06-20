import { Suspense } from "react";
import MarketingConexionesPage from "./MarketingConexionesClient";
import { ConexionesSkeleton } from "@/components/Skeleton";

export default function ConexionesPage() {
  return (
    <Suspense fallback={<ConexionesSkeleton />}>
      <MarketingConexionesPage />
    </Suspense>
  );
}

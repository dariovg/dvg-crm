"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }) {
  return (
    <SessionProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </SessionProvider>
  );
}

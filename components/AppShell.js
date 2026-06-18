"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

export default function AppShell({ children }) {
  return (
    <SessionProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <div className="app-topbar">
            <GlobalSearch />
          </div>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

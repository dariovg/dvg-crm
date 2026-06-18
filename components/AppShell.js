"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import NotificationBell from "@/components/NotificationBell";

export default function AppShell({ children }) {
  return (
    <SessionProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <div className="app-topbar">
            <NotificationBell />
            <GlobalSearch />
          </div>
          {children}
        </main>
      </div>
      <KeyboardShortcuts />
    </SessionProvider>
  );
}

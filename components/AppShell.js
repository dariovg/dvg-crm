"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import NotificationBell from "@/components/NotificationBell";
import { HamburgerButton, MobileDrawer, BottomTabBar } from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDrawer() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <SessionProvider>
      <div className="app-shell">
        <Sidebar />
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
        <main className="app-main">
          <div className="app-topbar">
            <HamburgerButton open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
            <div className="app-topbar-actions">
              <ThemeToggle compact className="theme-toggle--topbar" />
              <NotificationBell />
              <GlobalSearch />
            </div>
          </div>
          {children}
        </main>
      </div>
      <BottomTabBar onMoreClick={openDrawer} />
      <KeyboardShortcuts />
    </SessionProvider>
  );
}

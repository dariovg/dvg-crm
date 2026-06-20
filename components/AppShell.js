"use client";

import { useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import NotificationBell from "@/components/NotificationBell";
import { HamburgerButton, MobileDrawer, BottomTabBar } from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import PageTransition from "@/components/PageTransition";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import HelpButton from "@/components/HelpButton";
import UserMenu from "@/components/UserMenu";
import { canAccessSalesCrm } from "@/lib/permissions";

function AppShellInner({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const salesAccess = canAccessSalesCrm(session);

  function openDrawer() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
      <main className="app-main">
        <div className="app-topbar">
          <HamburgerButton open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
          <div className="app-topbar-actions">
            <HelpButton />
            <ThemeToggle compact className="theme-toggle--topbar" />
            {salesAccess && <NotificationBell />}
            {salesAccess && <GlobalSearch />}
            <UserMenu />
          </div>
        </div>
        <OnboardingChecklist />
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomTabBar onMoreClick={openDrawer} />
      {salesAccess && <KeyboardShortcuts />}
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <SessionProvider>
      <AppShellInner>{children}</AppShellInner>
    </SessionProvider>
  );
}

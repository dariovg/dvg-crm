"use client";

import { SessionProvider } from "next-auth/react";
import LocaleProvider from "@/components/LocaleProvider";

export default function LoginLayout({ children }) {
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      totpEnabled?: boolean;
      sessionId?: string | null;
      tokenVersion?: number;
    } & DefaultSession["user"];
  }

  interface User {
    sessionId?: string | null;
    tokenVersion?: number;
    totpEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sessionId?: string | null;
    tokenVersion?: number;
    totpEnabled?: boolean;
    invalid?: boolean;
  }
}

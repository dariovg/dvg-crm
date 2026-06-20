import CredentialsProvider from "next-auth/providers/credentials";
import { verifyLoginCredentials } from "./verify-login";
import { hashIp } from "./login-security";
import { isSessionValid, touchUserSession } from "./session-tracker";
import { prisma } from "./prisma";

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://crm.dvgsstudio.com";
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        totp: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email;
        const password = credentials?.password;
        const totp = credentials?.totp;
        const ip =
          req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req?.headers?.["x-real-ip"] ||
          "unknown";
        const ipHash = hashIp(ip);

        return verifyLoginCredentials({ email, password, ipHash, totp, req });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.sessionId = user.sessionId;
        token.tokenVersion = user.tokenVersion ?? 0;
        token.totpEnabled = user.totpEnabled ?? false;
        token.invalid = false;
        return token;
      }

      if (trigger === "update" && token.sub && token.sub !== "env-admin") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { totpEnabled: true, tokenVersion: true },
        });
        if (dbUser) {
          token.totpEnabled = dbUser.totpEnabled;
          token.tokenVersion = dbUser.tokenVersion;
        }
      }

      if (token.invalid) return token;

      const valid = await isSessionValid({
        userId: token.sub,
        sessionId: token.sessionId,
        tokenVersion: token.tokenVersion,
      });

      if (!valid) {
        token.invalid = true;
        return token;
      }

      if (token.sessionId) {
        await touchUserSession(token.sessionId);
      }

      return token;
    },
    async session({ session, token }) {
      if (token.invalid || !token.sub) {
        return { ...session, user: undefined, expires: new Date(0).toISOString() };
      }

      if (session.user) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.totpEnabled = token.totpEnabled ?? false;
        session.user.sessionId = token.sessionId;
        session.user.tokenVersion = token.tokenVersion ?? 0;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

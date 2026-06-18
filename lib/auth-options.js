import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

function allowedEmails() {
  return (process.env.CRM_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = (user?.email || "").toLowerCase();
      const allowed = allowedEmails();
      if (!allowed.length) return false;
      return allowed.includes(email);
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: session.user.email.toLowerCase() },
          update: {
            name: session.user.name,
            image: session.user.image,
          },
          create: {
            email: session.user.email.toLowerCase(),
            name: session.user.name,
            image: session.user.image,
            role:
              session.user.email.toLowerCase() ===
              (process.env.CRM_ADMIN_EMAIL || "").toLowerCase()
                ? "ADMIN"
                : "MEMBER",
          },
        });
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

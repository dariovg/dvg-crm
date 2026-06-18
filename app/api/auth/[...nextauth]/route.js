import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Credenciales hardcodeadas
        if (
          credentials?.email === "info@dvgsstudio.com" &&
          credentials?.password === "Informatica97"
        ) {
          return {
            id: "1",
            email: "info@dvgsstudio.com",
            name: "DVG CRM Admin",
          };
        }
        // Acceso denegado
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

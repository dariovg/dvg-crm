import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/pipeline/:path*",
    "/calendar/:path*",
    "/tasks/:path*",
    "/presupuestos/:path*",
    "/admin/:path*",
    "/leads/import",
    "/api/export/:path*",
  ],
};

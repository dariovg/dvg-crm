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
    "/admin/:path*",
    "/api/export/:path*",
  ],
};

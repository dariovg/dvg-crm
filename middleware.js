import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  isSalesPath,
  marketingModuleRedirect,
  marketingSalesRedirect,
} from "@/lib/rbac-routes";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const { pathname } = req.nextUrl;

    if (token?.invalid) {
      return NextResponse.redirect(new URL("/login?reason=session_revoked", req.url));
    }

    if (
      process.env.NODE_ENV === "production" &&
      token?.sub === "env-admin"
    ) {
      return NextResponse.redirect(new URL("/login?reason=env_admin", req.url));
    }

    const marketingDenied = marketingModuleRedirect(role, pathname);
    if (marketingDenied) {
      return NextResponse.redirect(new URL(marketingDenied, req.url));
    }

    if (pathname.startsWith("/marketing")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      const totpEnabled = token?.totpEnabled === true;
      const isSecurityPage =
        pathname === "/admin/security" ||
        pathname.startsWith("/admin/security/");

      if (!totpEnabled && !isSecurityPage) {
        const url = new URL("/admin/security", req.url);
        url.searchParams.set("setup", "2fa");
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }

    if (pathname.startsWith("/api/export")) {
      if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/marketing")) {
      if (role !== "ADMIN" && role !== "MARKETING") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.next();
    }

    if (role === "ADMIN" && !token?.totpEnabled && isSalesPath(pathname)) {
      const url = new URL("/admin/security", req.url);
      url.searchParams.set("setup", "2fa");
      return NextResponse.redirect(url);
    }

    const salesDenied = marketingSalesRedirect(role, pathname);
    if (salesDenied) {
      return NextResponse.redirect(new URL(salesDenied, req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token }) => {
        if (token?.invalid) return false;
        if (
          process.env.NODE_ENV === "production" &&
          token?.sub === "env-admin"
        ) {
          return false;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/leads",
    "/leads/:path*",
    "/pipeline",
    "/pipeline/:path*",
    "/calendar",
    "/calendar/:path*",
    "/tasks",
    "/tasks/:path*",
    "/presupuestos",
    "/presupuestos/:path*",
    "/admin",
    "/admin/:path*",
    "/marketing",
    "/marketing/:path*",
    "/api/export/:path*",
    "/api/marketing/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const SALES_PREFIXES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/calendar",
  "/tasks",
  "/presupuestos",
];

function isSalesPath(pathname) {
  return SALES_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/marketing")) {
      if (role !== "ADMIN" && role !== "MARKETING") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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

    if (role === "MARKETING" && isSalesPath(pathname)) {
      return NextResponse.redirect(new URL("/marketing", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
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

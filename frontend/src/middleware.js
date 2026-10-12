import { NextResponse } from "next/server";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const REQUIRE_ADMIN_PREFIX = [
  "/dashboard/mantenimiento",
  "/dashboard/reportes",
];

const REQUIRE_ROLES_PREFIX = [
  { prefix: "/dashboard/inscripciones", roles: ["ADMIN", "STAFF", "STAFF_TECNICO"] },
];

export function middleware(request) {
  const token = request.cookies.get("mwt_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    token &&
    REQUIRE_ADMIN_PREFIX.some((prefix) => pathname.startsWith(prefix))
  ) {
    const payload = decodeJwt(token);
    const roles = Array.isArray(payload?.roles)
      ? payload.roles.map((r) => String(r).toUpperCase())
      : [];
    const isAdmin = roles.includes("ADMIN");
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const roleRule = REQUIRE_ROLES_PREFIX.find((rule) =>
    pathname.startsWith(rule.prefix)
  );
  if (token && roleRule) {
    const payload = decodeJwt(token);
    const roles = Array.isArray(payload?.roles)
      ? payload.roles.map((r) => String(r).toUpperCase())
      : [];
    const allowed = new Set(roleRule.roles.map((r) => String(r).toUpperCase()));
    if (!roles.some((r) => allowed.has(r))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
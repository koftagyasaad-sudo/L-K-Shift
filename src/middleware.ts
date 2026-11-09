import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes('.') ||
    pathname.includes("/apply") ||
    pathname === "/favicon.ico" ||
    pathname === "/Logo.png" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.includes("/login") || pathname.includes("/forgot-password");
  const isLocaleRoot = pathname === "/" || pathname === "/ar" || pathname === "/en";
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "lk-shift-super-secret-jwt-key-prod-2026",
  });

  if (!token && !isAuthPage && !isLocaleRoot) {
    const locale = pathname.startsWith("/en") ? "en" : "ar";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lk-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

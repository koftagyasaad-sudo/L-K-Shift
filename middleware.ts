import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { decode } from "next-auth/jwt";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "lk-shift-super-secret-jwt-key-prod-2026";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const intlResponse = intlMiddleware(request);

  const localeMatch = pathname.match(/^\/(ar|en)(?:\/|$)/);
  if (!localeMatch) return intlResponse;

  const locale = localeMatch[1];
  const isAuthPage = pathname.includes("/login") || pathname.includes("/forgot-password");
  const isPublicPage = pathname === `/${locale}` || pathname.includes("/careers");

  if (isAuthPage || isPublicPage) {
    return intlResponse;
  }

  const rawToken =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!rawToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = await decode({ token: rawToken, secret: JWT_SECRET });
    if (!decoded) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*|careers).*)", "/(ar|en)/:path*"],
};

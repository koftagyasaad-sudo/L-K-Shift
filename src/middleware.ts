import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/serve';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // استثناء ملفات الصور، الـ Service Worker، الأصول الثابتة، واستمارة التوظيف العامة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.includes('/apply') ||
    pathname === '/favicon.ico' ||
    pathname === '/Logo.png' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('lk_session_token')?.value;
  const isAuthPage = pathname.includes('/login') || pathname.includes('/forgot-password');

  // إذا كان المستخدم غير مسجل ويحاول الوصول لصفحات التطبيق الداخلية
  if (!token && !isAuthPage && pathname !== '/' && !pathname.endsWith('/ar') && !pathname.endsWith('/en')) {
    const locale = pathname.startsWith('/en') ? 'en' : 'ar';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export const config = {
  // استثناء مسارات التوظيف العامة، الصور، الأيقونات، والـ API من أي اعتراض
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*|careers).*)',
    '/(ar|en)/:path*',
  ],
};

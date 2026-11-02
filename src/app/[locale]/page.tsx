import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

// 1. عزل التصيير الديناميكي لمنع انهيار الـ Build أثناء فحص اتصالات Drizzle
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 2. ضبط Types متوافقة 100% مع Next.js 15+ Asynchronous APIs
interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// 3. مكون تحميل هيكلي (Fallback UI) للحفاظ على تجربة المستخدم ومنع وميض الشاشة
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// 4. استدعاء البيانات بأمان عبر طبقة الخدمة المعزولة (Server Data Fetching)
async function ContentSection({ locale }: { locale: string }) {
  // تفعيل الـ locale لتجنب تحذيرات next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {t('description')}
      </p>
    </main>
  );
}

// 5. نقطة الدخول الرئيسية للصفحة
export default async function Page({ params, searchParams }: PageProps) {
  // فك الـ Promises لتوافق المحرك البرمجي دون تعارض
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { locale } = resolvedParams;

  // التحقق من وجود اللغة المدعومة لمنع أخطاء الـ Routing
  const supportedLocales = ['ar', 'en']; // مطابقة للغات المعرفة في middleware.ts
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContentSection locale={locale} />
    </Suspense>
  );
}

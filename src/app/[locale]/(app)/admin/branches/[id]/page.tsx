import React from 'react';
import BranchesClient from './BranchesClient';

// منع التوليد الاستاتيكي الخاطئ أثناء التجميع لضمان جاهزية الخادم
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// تأمين حدود الأنواع (Type Boundary) لمنع انهيار الـ Build في حال اختلاف الـ Props الداخلية للمكون
const SafeBranchesClient = BranchesClient as React.ComponentType<{
  locale?: string;
  [key: string]: any;
}>;

export default async function AdminBranchesPage({ params }: PageProps) {
  // فك الـ Route Parameters غير المتزامنة وفق معايير Next.js 15 الرسمية
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  return (
    <main className="w-full min-h-screen">
      <SafeBranchesClient locale={locale} />
    </main>
  );
}

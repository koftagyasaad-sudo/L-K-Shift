import React from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PublicBranchesPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {locale === 'ar' ? 'فروعنا' : 'Our Branches'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {locale === 'ar' ? 'قائمة الفروع ومواقعها الجغرافية' : 'List of our branches and geographic locations'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          {locale === 'ar' ? 'يتم تحديث بيانات الفروع...' : 'Loading branch locations...'}
        </p>
      </div>
    </div>
  );
}

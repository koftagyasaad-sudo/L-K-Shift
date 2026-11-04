'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function RootLocaleDispatcher({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');

    if (authStatus === 'true') {
      // التوجيه الحاسم إلى لوحة القيادة المركزية
      router.replace(`/${locale}/admin/dashboard`);
    } else {
      router.replace(`/${locale}/login`);
    }
  }, [locale, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <span className="text-xs font-semibold text-slate-400">L-K Shift Core...</span>
      </div>
    </div>
  );
}

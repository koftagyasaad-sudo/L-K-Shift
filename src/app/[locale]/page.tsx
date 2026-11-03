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
    // التحقق الفوري من حالة المصادقة المخزنة في المتصفح
    const authStatus = localStorage.getItem('isAuthenticated');

    if (authStatus === 'true') {
      // المستخدم مسجل دخوله: التوجيه فوراً لداخل النظام والقالب الداكن
      router.replace(`/${locale}/admin/branches`);
    } else {
      // المستخدم غير مسجل: التوجيه فوراً لشاشة تسجيل الدخول الداكنة كواجهة أولى
      router.replace(`/${locale}/login`);
    }
  }, [locale, router]);

  // شاشة تحميل لحظية بنفس الثيم الداكن لنظام L-K Shift لمنع أي وميض أبيض
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <span className="text-xs font-medium text-slate-400">L-K Shift...</span>
      </div>
    </div>
  );
}

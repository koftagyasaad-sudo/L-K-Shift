'use client';

import React, { useState, useEffect, use } from 'react';
import BranchesClient, { BranchData } from './BranchesClient';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function BranchesPage({ params }: PageProps) {
  // فك الـ Asynchronous Params لتوافق Next.js 15+ في Client Components
  const resolvedParams = use(params);
  const { locale } = resolvedParams;

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBranches() {
      try {
        setIsLoading(true);
        setFetchError(null);

        const response = await fetch('/api/admin/branches', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('فشل جلب قائمة الفروع من الخادم');
        }

        const data = await response.json();
        const rawList: any[] = Array.isArray(data)
          ? data
          : data?.branches || data?.data || [];

        if (isMounted) {
          // التحويل الهيكلي الصارم لضمان استيفاء عقد BranchData كاملاً ومنع أخطاء TypeScript
          const formatted: BranchData[] = rawList.map((b: any) => {
            const fallbackName = b?.name || b?.nameAr || b?.nameEn || 'فرع بدون اسم';

            return {
              id: String(b?.id || Math.random().toString(36).substring(2, 9)),
              name: fallbackName,
              nameAr: b?.nameAr || b?.name || 'فرع بدون اسم',
              nameEn: b?.nameEn || '',
              address: b?.address || '',
              latitude: String(b?.latitude !== null && b?.latitude !== undefined ? b.latitude : ''),
              longitude: String(b?.longitude !== null && b?.longitude !== undefined ? b.longitude : ''),
              geofenceRadius: Number(b?.geofenceRadius || b?.radiusMeters || 100),
              radiusMeters: Number(b?.radiusMeters || b?.geofenceRadius || 100),
              isActive: b?.isActive ?? true,
            };
          });

          setBranches(formatted);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تحميل الفروع';
          setFetchError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">جاري تحميل الفروع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {fetchError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" dir="rtl">
          {fetchError}
        </div>
      )}
      <BranchesClient branches={branches} locale={locale} />
    </div>
  );
}

import React from 'react';
import { getBranchesAction } from '@/actions/branches';
import BranchesClient, { BranchData } from '../admin/branches/BranchesClient';

// منع الـ Static Prerendering أثناء فحص الـ Build وضمان جلب أحدث البيانات من قاعدة البيانات
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BranchesPage({ params }: PageProps) {
  // 1. فك الـ Asynchronous Params لتوافق Next.js 15+
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  // 2. استدعاء البيانات من الـ Server Action مع حماية ضد الـ Null/Undefined
  let branchesList: any[] = [];
  try {
    const result = await getBranchesAction();
    branchesList = Array.isArray(result) ? result : (result?.data || []);
  } catch (error) {
    console.error('Failed to fetch branches in BranchesPage:', error);
    branchesList = [];
  }

  // 3. التحويل الهيكلي مع استيفاء عقد BranchData كاملاً رأسياً وأفقياً
  const formattedBranches: BranchData[] = branchesList.map((b: any) => {
    // تحديد الاسم الافتراضي بأمان لتفادي القيم الفارغة
    const fallbackName = b?.name || b?.nameAr || b?.nameEn || 'فرع بدون اسم';

    return {
      id: String(b?.id || Math.random().toString(36).substring(2, 9)),
      // معالجة الخطأ الجذري: توفير الحقل الإجباري 'name' المطلوب في واجهة BranchData
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

  return (
    <div className="w-full">
      <BranchesClient 
        branches={formattedBranches} 
        locale={locale} 
      />
    </div>
  );
}

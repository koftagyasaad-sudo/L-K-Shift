'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeZkSheet from '@/components/admin/employee-zk-sheet';
import { ArrowRight, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function EmployeeZkSheetPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const employeeId = resolvedParams?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSheetData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${employeeId}/zk-report`, { cache: 'no-store' });
        if (!res.ok) throw new Error('فشل جلب بيانات الشيت للموظف');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    }
    if (employeeId) fetchSheetData();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-xs font-semibold text-slate-400">جاري استخراج وتفريغ شيت الحضور والمسير المالي...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-400">
          <p className="font-bold text-sm">{error || 'لم يتم العثور على بيانات'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            العودة لقائمة الموظفين
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="no-print">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
        >
          <ArrowRight size={14} /> العودة للموظفين
        </button>
      </div>

      <EmployeeZkSheet
        employee={data.employee}
        monthName={data.monthName}
        year={data.year}
        records={data.records}
        approvedAdvancesTotal={data.approvedAdvancesTotal}
      />
    </div>
  );
}

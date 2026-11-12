'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeZkSheet from '@/components/admin/employee-zk-sheet';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

interface ZkSheetData {
  employee: {
    name: string;
    employeeCode: string;
    phone: string;
    role: string;
    branchName: string;
    basicSalary: number;
    workingHoursPerDay: number;
  };
  monthName: string;
  year: number;
  approvedAdvancesTotal: number;
  records: Array<{
    date: string;
    dayName: string;
    shiftSchedule: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    gpsVerified: boolean;
    gpsDistance: number;
    photoUrl: string | null;
    photoVerified: boolean;
    workedMinutes: number;
    lateMinutes: number;
    overtimeMinutes: number;
    status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF';
    leaveReason?: string;
  }>;
}

export default function EmployeeZkSheetPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const employeeId = resolvedParams?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ZkSheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSheetData() {
      try {
        setLoading(true);
        setError(null);

        // جلب البيانات من مسار الـ route الموجود بجانب الصفحة
        const endpoint = `/${locale}/admin/employees/${employeeId}/zk-report`;
        const res = await fetch(endpoint, { cache: 'no-store' });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'فشل جلب بيانات الشيت للموظف');
        }

        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء استخراج الشيت');
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) {
      fetchSheetData();
    }
  }, [employeeId, locale]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-xs font-semibold text-slate-400">جاري استخراج وتفريغ شيت الحضور والمسير المالي ZK...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto" dir="rtl">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-400 space-y-3">
          <div className="flex items-center justify-center gap-2 font-bold text-sm">
            <AlertCircle size={18} />
            <span>{error || 'لم يتم العثور على بيانات الموظف'}</span>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-2 rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
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
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <ArrowRight size={14} /> العودة لقائمة الموظفين
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

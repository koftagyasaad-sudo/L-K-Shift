'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

interface DailyRecord {
  id: string;
  workDate: string;
  branchName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  dayEarned: number;
  dayLateDeduction: number;
  status: string;
}

interface SalaryData {
  employee: {
    id: string;
    fullName: string;
    phone: string;
    employeeCode: string;
    jobRole: string;
    branchName: string;
    shiftStartTime: string;
    shiftEndTime: string;
    workingHoursPerDay: number;
  };
  summary: {
    month: string;
    basicSalary: number;
    dailyRate: number;
    hourlyRate: number;
    presentDays: number;
    totalWorkedHours: number;
    totalWorkedMinutes: number;
    totalLateMinutes: number;
    totalOvertimeMinutes: number;
    overtimePay: number;
    manualBonus: number;
    totalAdditions: number;
    lateDeduction: number;
    manualDeduction: number;
    totalDeductions: number;
    earnedByDays: number;
    netSalary: number;
  };
  records: DailyRecord[];
}

export default function EmployeeSalaryPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchSalarySheet = useCallback(async (month: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/employee/my-salary?month=${encodeURIComponent(month)}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'تعذر تحميل بيان الراتب');
      }
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الشيت');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSalarySheet(selectedMonth);
  }, [selectedMonth, fetchSalarySheet]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString('ar-EG', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatDuration = (mins: number) => {
    if (!mins || mins <= 0) return '0س 0د';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}س ${m}د`;
  };

  const emp = data?.employee;
  const sum = data?.summary;
  const records = data?.records || [];

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-16" dir="rtl">
      {/* الترويسة بدون زر الرئيسية نهائياً */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232a32] p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#57cef8]" />
            <span>بيان الراتبوشيت الحضور التفصيلي</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            كشف حسابك الشهري المفصل شاملاً الراتب الأساسي، الساعات الفعلية، الإضافي، الخصومات، وسجل البصمات اليومي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#181d23] px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => void fetchSalarySheet(selectedMonth)}
            className="inline-flex items-center gap-1.5 rounded bg-[#57cef8] px-3 py-1.5 text-xs font-extrabold text-[#181d23] transition hover:opacity-90 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث الشيت</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-rose-500/40 bg-rose-500/10 p-3 text-xs font-bold text-rose-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* بطاقة بيانات الموظف والملخص المالي الكامل */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232a32] p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {emp?.fullName || 'جاري التحميل...'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              كود: #{emp?.employeeCode || '---'} • {emp?.phone || ''} • الفرع: {emp?.branchName || '---'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#57cef8]/15 border border-[#57cef8]/40 px-2.5 py-1 text-xs font-extrabold text-[#0099cc] dark:text-[#57cef8]">
              {emp?.jobRole || 'موظف'}
            </span>
            <span className="rounded bg-slate-100 dark:bg-[#181d23] px-2.5 py-1 text-xs font-mono text-slate-600 dark:text-slate-300">
              الوردية: {emp?.shiftStartTime || '10:00'} إلى {emp?.shiftEndTime || '18:00'} ({emp?.workingHoursPerDay || 8}س)
            </span>
          </div>
        </div>

        {/* الكروت المالية الـ 6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181d23] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">الراتب الأساسي (30 يوم)</div>
            <div className="mt-1 text-base font-extrabold font-mono text-slate-900 dark:text-white">
              {sum ? `${sum.basicSalary.toLocaleString()} ج.م` : '—'}
            </div>
          </div>

          <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181d23] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">يومية الموظف / الساعة</div>
            <div className="mt-1 text-sm font-extrabold font-mono text-[#0099cc] dark:text-[#57cef8]">
              {sum ? `${sum.dailyRate} ج / ${sum.hourlyRate} ج` : '—'}
            </div>
          </div>

          <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181d23] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">أيام الحضور والساعات</div>
            <div className="mt-1 text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {sum ? `${sum.presentDays} يوم (${sum.totalWorkedHours} س)` : '—'}
            </div>
          </div>

          <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> إجمالي الإضافي والمكافآت
            </div>
            <div className="mt-1 text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {sum ? `+${sum.totalAdditions.toLocaleString()} ج.م` : '0 ج.م'}
            </div>
          </div>

          <div className="rounded border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> إجمالي التأخير والخصومات
            </div>
            <div className="mt-1 text-base font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {sum ? `-${sum.totalDeductions.toLocaleString()} ج.م` : '0 ج.م'}
            </div>
          </div>

          <div className="rounded border-2 border-[#57cef8] bg-[#57cef8]/10 p-3">
            <div className="text-[11px] font-bold text-[#0099cc] dark:text-[#57cef8]">صافي الراتب المستحق</div>
            <div className="mt-1 text-base font-black font-mono text-slate-900 dark:text-white">
              {sum ? `${sum.netSalary.toLocaleString()} ج.م` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* جدول تفصيلي كامل لحركات الحضور والانصراف اليومية الخاصة بالموظف */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232a32] shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
            <FileSpreadsheet className="h-4 w-4 text-[#57cef8]" />
            <span>شيت الحضور والانصراف اليومي التفصيلي ({records.length} يوم مسجل في {selectedMonth})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-right text-xs">
            <thead>
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الفرع</th>
                <th className="p-3 text-center">وقت الحضور</th>
                <th className="p-3 text-center">وقت الانصراف</th>
                <th className="p-3 text-center">ساعات العمل</th>
                <th className="p-3 text-center">تأخير</th>
                <th className="p-3 text-center">إضافي</th>
                <th className="p-3 text-center">خصم التأخير</th>
                <th className="p-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    جاري تحميل شيت الراتب والحضور...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    لا توجد بصمات مسجلة في هذا الشهر ({selectedMonth}) حتى الآن.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{r.workDate}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{r.branchName}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatTime(r.checkInTime)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#0099cc] dark:text-[#57cef8]">
                      {formatTime(r.checkOutTime)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatDuration(r.workedMinutes)}
                    </td>
                    <td className="p-3 text-center font-mono text-rose-500">
                      {r.lateMinutes > 0 ? `${r.lateMinutes} د` : '—'}
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-500">
                      {r.overtimeMinutes > 0 ? `+${r.overtimeMinutes} د` : '—'}
                    </td>
                    <td className="p-3 text-center font-mono text-rose-500">
                      {r.dayLateDeduction > 0 ? `-${r.dayLateDeduction} ج` : '0 ج'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {r.checkOutTime ? 'مكتمل' : 'حاضر بالفرع'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

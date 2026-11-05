'use client';

import React, { useState, useEffect, use } from 'react';

interface AttendanceLog {
  id: number;
  userId: number;
  userName?: string;
  userPhone?: string;
  totalLeaves?: number;
  usedLeaves?: number;
  permissionHours?: number;
  branchName?: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  distanceMeters?: number;
  isVerifiedGeofence?: boolean;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AttendanceReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // جلب الموظفين لملء قائمة الفلترة
  useEffect(() => {
    fetch('/api/employees', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load employees:', err));
  }, []);

  // جلب السجلات المفلترة
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const paramsObj = new URLSearchParams();
      if (selectedUser) paramsObj.set('userId', selectedUser);
      if (fromDate) paramsObj.set('from', fromDate);
      if (toDate) paramsObj.set('to', toDate);

      const res = await fetch(`/api/attendance?${paramsObj.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, fromDate, toDate]);

  // تصفية السجلات نصياً
  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      (log.userName || '').toLowerCase().includes(term) ||
      (log.userPhone || '').toLowerCase().includes(term) ||
      (log.branchName || '').toLowerCase().includes(term)
    );
  });

  // حساب الملخص المالي والإداري للموظف المحدد
  const selectedEmpObj = employees.find((e) => String(e.id) === String(selectedUser));
  const totalAnnualLeaves = selectedEmpObj?.annualLeaveDays || 21;
  const usedLeaves = selectedEmpObj?.usedLeaveDays || 0;
  const remainingLeaves = Math.max(0, totalAnnualLeaves - usedLeaves);

  // دالة تصدير شيت Excel عربي نقي متوافق 100% مع Microsoft Excel
  const exportToExcel = () => {
    if (filteredLogs.length === 0) {
      alert(isRtl ? 'لا توجد بيانات مطابقة لتصديرها' : 'No data to export');
      return;
    }

    const headers = [
      'م',
      'اسم الموظف',
      'رقم التليفون',
      'الفرع المسند',
      'نوع البصمة',
      'التاريخ والوقت',
      'المسافة عن الفرع (متر)',
      'التحقق الجغرافي GPS',
    ];

    const rows = filteredLogs.map((log, index) => [
      index + 1,
      `"${log.userName || 'موظف'}"`,
      `"${log.userPhone || ''}"`,
      `"${log.branchName || '—'}"`,
      `"${log.type === 'CHECK_IN' ? 'حضور' : 'انصراف'}"`,
      `"${new Date(log.timestamp).toLocaleString('ar-EG')}"`,
      log.distanceMeters ?? '—',
      log.isVerifiedGeofence ? 'مطابق للنطاق' : 'خارج النطاق',
    ]);

    // إضافة BOM (\uFEFF) ليقرأ Excel الحروف العربية دون أي تشوه
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_حضور_LK_Shift_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة مع زر التصدير */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'سجل بصمات الحضور والإنصراف' : 'Attendance Audit & Logs'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isRtl ? 'متابعة فورية للحركات المسجلة عبر البصمة والتحقق الجغرافي بالـ GPS' : 'Live check-in audit & GPS proofs'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-700 cursor-pointer"
          >
            {isRtl ? '📊 سحب شيت Excel' : 'Export Excel'}
          </button>
          <button
            type="button"
            onClick={fetchLogs}
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 cursor-pointer"
          >
            {isRtl ? 'تحديث البيانات' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات وأرصدة الإجازات المتبقية للموظف */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRtl ? 'إجمالي الحركات' : 'Total Logs'}</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{filteredLogs.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRtl ? 'حركات الحضور' : 'Check-Ins'}</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {filteredLogs.filter((l) => l.type === 'CHECK_IN').length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRtl ? 'رصيد الإجازات المتبقي' : 'Remaining Leaves'}</span>
          <div className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
            {selectedUser ? `${remainingLeaves} يوم` : 'اختر موظف'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRtl ? 'الأذونات الشهرية' : 'Monthly Permissions'}</span>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {selectedEmpObj ? `${selectedEmpObj.monthly_permissions_hours || 0} ساعة` : '0 ساعة'}
          </div>
        </div>
      </div>

      {/* قسم الفلاتر المتقدمة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isRtl ? 'تصفية حسب الموظف' : 'Filter Employee'}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{isRtl ? '-- جميع الموظفين --' : '-- All Staff --'}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || emp.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isRtl ? 'من تاريخ' : 'From Date'}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isRtl ? 'إلى تاريخ' : 'To Date'}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isRtl ? 'بحث سريع' : 'Quick Search'}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث باسم الموظف أو الفرع...' : 'Search...'}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* جدول السجلات التفصيلي */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">{isRtl ? 'لا توجد سجلات متطابقة مع البحث' : 'No logs found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الموظف' : 'Employee'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الفرع' : 'Branch'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نوع البصمة' : 'Type'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'التوقيت' : 'Timestamp'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المسافة عن الفرع' : 'Distance'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'التحقق' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div>{log.userName || 'موظف'}</div>
                      <div className="text-xs font-mono font-normal text-slate-500">{log.userPhone || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{log.branchName || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          log.type === 'CHECK_IN'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {log.type === 'CHECK_IN' ? (isRtl ? 'حضور' : 'Check-In') : (isRtl ? 'انصراف' : 'Check-Out')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {new Date(log.timestamp).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {log.distanceMeters !== undefined ? `${log.distanceMeters} م` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          log.isVerifiedGeofence
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {log.isVerifiedGeofence ? (isRtl ? 'GPS مطابق' : 'Verified') : (isRtl ? 'يدوي' : 'Manual')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

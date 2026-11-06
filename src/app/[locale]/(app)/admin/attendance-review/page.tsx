'use client';

import React, { useState, useEffect, useRef, use } from 'react';

interface AttendanceLog {
  id: number;
  userId: string;
  userName?: string;
  userPhone?: string;
  totalLeaves?: number;
  usedLeaves?: number;
  permissionHours?: number;
  basicSalary?: number;
  workingHoursPerDay?: number;
  branchName?: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  distanceMeters?: number;
  isVerifiedGeofence?: boolean;
  photoUrl?: string;
}

interface PayrollItem {
  id: number;
  name: string;
  phone: string;
  role: string;
  branchName: string;
  hoursPerDay: number;
  monthlySalary: number;
  hourlyRate: number;
  attendedDays: number;
  totalWorkedHours: number;
  overtimeHours: number;
  overtimePay: number;
  excessPermHours: number;
  permDeduction: number;
  totalAdvances: number;
  totalDeductions: number;
  netSalary: number;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AttendanceAndPayrollReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'PAYROLL'>('ATTENDANCE');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');

  // خانات التاريخ مع مراجع أزرار التقويم
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('مدير النظام');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'موظف';
    const uid = localStorage.getItem('userId') || '';
    setUserRole(role);
    setCurrentUserId(uid);

    const isAdmin = role === 'مدير النظام' || role === 'SUPER_ADMIN' || role === 'admin';

    if (!isAdmin && uid) {
      setSelectedUser(uid);
    }

    if (isAdmin) {
      fetch('/api/employees', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setEmployees(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load employees:', err));
    }
  }, []);

  const isAdmin = userRole === 'مدير النظام' || userRole === 'SUPER_ADMIN' || userRole === 'admin';

  // جلب حركات الحضور
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const paramsObj = new URLSearchParams();
      const targetUserId = isAdmin ? selectedUser : currentUserId;
      if (targetUserId) paramsObj.set('userId', targetUserId);
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

  // جلب تقرير الرواتب الشهري
  const fetchPayroll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/payroll?month=${selectedMonth}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPayrollData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ATTENDANCE') {
      fetchLogs();
    } else if (isAdmin) {
      fetchPayroll();
    }
  }, [activeTab, selectedUser, fromDate, toDate, selectedMonth]);

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      (log.userName || '').toLowerCase().includes(term) ||
      (log.userPhone || '').toLowerCase().includes(term) ||
      (log.branchName || '').toLowerCase().includes(term)
    );
  });

  const selectedEmpObj = employees.find((e) => String(e.id) === String(selectedUser));
  const totalAnnualLeaves = selectedEmpObj?.annualLeaveDays || 21;
  const usedLeaves = selectedEmpObj?.usedLeaveDays || 0;
  const remainingLeaves = Math.max(0, totalAnnualLeaves - usedLeaves);

  // تصدير شيت الحضور إلى إكسيل
  const exportAttendanceExcel = () => {
    if (!isAdmin) return;
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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_حضور_LK_Shift_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصدير شيت الرواتب ومسير المرتبات الدقيق
  const exportPayrollExcel = () => {
    if (!isAdmin) return;
    if (payrollData.length === 0) {
      alert('لا توجد بيانات مسير رواتب لهذا الشهر');
      return;
    }

    const headers = [
      'م',
      'اسم الموظف',
      'رقم الهاتف',
      'الوظيفة والفرع',
      'ساعات العمل المقررة/يوم',
      'الراتب الأساسي',
      'أجر الساعة',
      'أيام الحضور الفعلية',
      'ساعات العمل الفعلية',
      'ساعات الإضافي',
      'قيمة الإضافي',
      'خصومات الأذونات',
      'خصم السلف المستحقة',
      'إجمالي الخصومات',
      'صافي الراتب المستحق (100%)',
    ];

    const rows = payrollData.map((p, index) => [
      index + 1,
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${p.role} - ${p.branchName}"`,
      p.hoursPerDay,
      p.monthlySalary,
      p.hourlyRate,
      p.attendedDays,
      p.totalWorkedHours,
      p.overtimeHours,
      p.overtimePay,
      p.permDeduction,
      p.totalAdvances,
      p.totalDeductions,
      p.netSalary,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `مسير_رواتب_LK_Shift_شهر_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة وأزرار التصدير والتبديل */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {isAdmin ? 'سجل بصمات الحضور ومسير الرواتب' : 'سجل حضورك'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'متابعة لحظية لحركات البصمة الحية والسيلفي، وحساب استحقاقات الراتب وخصومات السلف بدقة 100%'
              : 'ملخص حركات حضورك وانصرافك ورصيد إجازاتك'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && activeTab === 'ATTENDANCE' && (
            <button
              type="button"
              onClick={exportAttendanceExcel}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-700 cursor-pointer"
            >
              📊 سحب شيت الحضور
            </button>
          )}

          {isAdmin && activeTab === 'PAYROLL' && (
            <button
              type="button"
              onClick={exportPayrollExcel}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
            >
              💰 سحب مسير الرواتب المالي
            </button>
          )}

          <button
            type="button"
            onClick={activeTab === 'ATTENDANCE' ? fetchLogs : fetchPayroll}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 cursor-pointer"
          >
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* تبويبات التبديل بين كشف البصمات ومسير الرواتب */}
      {isAdmin && (
        <div className="flex rounded-2xl bg-slate-200/60 dark:bg-white/5 p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📋 سجل البصمات والصور الحية ({filteredLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'PAYROLL'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💵 شيت حساب الرواتب والخصومات بدقة 100%
          </button>
        </div>
      )}

      {/* المحتوى 1: سجل البصمات اليومية */}
      {activeTab === 'ATTENDANCE' ? (
        <div className="space-y-6">
          {/* كروت الإحصائيات والأرصدة */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الحركات</span>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{filteredLogs.length}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">حركات الحضور</span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {filteredLogs.filter((l) => l.type === 'CHECK_IN').length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">رصيد الإجازات المتبقي</span>
              <div className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
                {isAdmin ? (selectedUser ? `${remainingLeaves} يوم` : 'اختر موظف') : `${remainingLeaves} يوم`}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">الأذونات الشهرية</span>
              <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
                {selectedEmpObj ? `${selectedEmpObj.monthly_permissions_hours || 0} ساعة` : '0 ساعة'}
              </div>
            </div>
          </div>

          {/* الفلاتر مع خانات التاريخ وزر التقويم التفاعلي المباشر */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
            {isAdmin && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  تصفية حسب الموظف
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- جميع الموظفين --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* خانة من تاريخ مع زر التقويم والكتابة اليدوية */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                من تاريخ
              </label>
              <div className="relative flex items-center">
                <input
                  ref={fromDateRef}
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => fromDateRef.current?.showPicker ? fromDateRef.current.showPicker() : fromDateRef.current?.focus()}
                  className="absolute left-2 text-slate-400 hover:text-orange-500 cursor-pointer"
                  title="فتح التقويم"
                >
                  📅
                </button>
              </div>
            </div>

            {/* خانة إلى تاريخ مع زر التقويم والكتابة اليدوية */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                إلى تاريخ
              </label>
              <div className="relative flex items-center">
                <input
                  ref={toDateRef}
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => toDateRef.current?.showPicker ? toDateRef.current.showPicker() : toDateRef.current?.focus()}
                  className="absolute left-2 text-slate-400 hover:text-orange-500 cursor-pointer"
                  title="فتح التقويم"
                >
                  📅
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                بحث سريع
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الموظف أو الفرع..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* جدول سجلات البصمات الحية */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
            {isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <p className="text-base font-medium">لا توجد سجلات متطابقة مع البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                  <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-4 font-semibold">الموظف</th>
                      <th className="px-6 py-4 font-semibold">الفرع المسند</th>
                      <th className="px-6 py-4 font-semibold">نوع الحركة</th>
                      <th className="px-6 py-4 font-semibold">التوقيت والتاريخ</th>
                      <th className="px-6 py-4 font-semibold">المسافة عن الفرع</th>
                      <th className="px-6 py-4 font-semibold text-center">الصورة السيلفي الحية</th>
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
                            {log.type === 'CHECK_IN' ? 'حضور' : 'انصراف'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                          {new Date(log.timestamp).toLocaleString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {log.distanceMeters !== undefined ? `${log.distanceMeters} م` : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {log.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(log.photoUrl || null)}
                              className="inline-flex rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 hover:bg-orange-500/20 cursor-pointer"
                            >
                              عرض السيلفي 👁️
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* المحتوى 2: مسير الرواتب ومحرك حساب المرتبات الدقيق 100% */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اختر شهر الاستحقاق:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              * يتم احتساب الراتب تلقائياً وفقاً لساعات العمل المقررة لكل موظف وخصومات السلف والأذونات المعتمدة.
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
            {isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : payrollData.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                لا توجد بيانات موظفين مسجلة لحساب المرتبات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-right text-xs dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
                  <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">الموظف والفرع</th>
                      <th className="px-4 py-3.5 font-bold">ساعات المقررة/يوم</th>
                      <th className="px-4 py-3.5 font-bold">الراتب الأساسي</th>
                      <th className="px-4 py-3.5 font-bold">أجر الساعة</th>
                      <th className="px-4 py-3.5 font-bold">أيام وساعات العمل</th>
                      <th className="px-4 py-3.5 font-bold">الإضافي</th>
                      <th className="px-4 py-3.5 font-bold">خصم الأذونات</th>
                      <th className="px-4 py-3.5 font-bold">خصم السلف</th>
                      <th className="px-4 py-3.5 font-bold text-center">صافي الراتب المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {payrollData.map((p) => (
                      <tr key={p.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          <div>{p.name}</div>
                          <div className="text-[11px] font-normal text-slate-500">{p.role} - {p.branchName}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">{p.hoursPerDay} س / يوم</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{p.monthlySalary} ج.م</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{p.hourlyRate} ج.م</td>
                        <td className="px-4 py-3.5 font-mono">
                          <span className="font-bold text-emerald-600">{p.attendedDays} يوم</span> ({p.totalWorkedHours} س)
                        </td>
                        <td className="px-4 py-3.5 font-mono text-emerald-600">
                          {p.overtimePay > 0 ? `+${p.overtimePay} ج.م (${p.overtimeHours}س)` : '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-rose-500">
                          {p.permDeduction > 0 ? `-${p.permDeduction} ج.م` : '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-rose-500 font-bold">
                          {p.totalAdvances > 0 ? `-${p.totalAdvances} ج.م` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex rounded-xl bg-emerald-500/10 px-3 py-1.5 text-sm font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {p.netSalary} ج.م
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
      )}

      {/* نافذة عرض صورة السيلفي */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-md w-full bg-[#121526] p-4 rounded-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">صورة السيلفي الحية لحظة البصمة</h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={selectedPhoto} alt="Attendance Selfie" className="w-full rounded-xl object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

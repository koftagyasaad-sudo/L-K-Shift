'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ClipboardCheck,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Search,
  User,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  X,
  Maximize2,
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  employeeCode: string;
  userPhone: string;
  branchName: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  gpsDistance: number;
  photoUrl: string | null;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: string;
  basicSalary: number;
  workingHoursPerDay: number;
}

export default function AttendanceReviewPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'LOGS' | 'PAYROLL'>('LOGS');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // حالة مودال عرض الصورة والتفاصيل
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // الفلاتر
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance?';
      if (selectedEmployee !== 'ALL') url += `userId=${selectedEmployee}&`;
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate) url += `to=${toDate}&`;

      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to load review records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedEmployee, fromDate, toDate]);

  const uniqueEmployees = Array.from(
    new Map(records.map((r) => [r.userId, { id: r.userId, name: r.userName }])).values()
  );

  const filteredRecords = records.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.userName || '').toLowerCase().includes(q) ||
      (r.branchName || '').toLowerCase().includes(q) ||
      (r.employeeCode || '').toLowerCase().includes(q)
    );
  });

  const totalMovements = filteredRecords.length;
  const checkInCount = filteredRecords.filter((r) => r.checkInTime).length;

  const formatTime = (ts: string | null) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime())
        ? '—'
        : d.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
    } catch {
      return '—';
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'الكود',
      'الموظف',
      'الفرع',
      'التاريخ',
      'الحضور',
      'الانصراف',
      'ساعات العمل',
      'التأخير (د)',
      'الراتب الأساسي',
    ];

    const rows = filteredRecords.map((r) => [
      r.employeeCode,
      r.userName,
      r.branchName,
      r.workDate,
      formatTime(r.checkInTime),
      formatTime(r.checkOutTime),
      `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د`,
      r.lateMinutes,
      r.basicSalary,
    ]);

    const csvContent =
      '\uFEFF' +
      ['"تقرير مسير الرواتب وحركات الحضور"', '', headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `شيت_الحضور_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة وأزرار التصدير والتحديث */}
      <div className="bg-white dark:bg-[#0c0e18] border border-slate-200 dark:border-white/5 p-6 sm:p-8 rounded-3xl shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">سجل بصمات الحضور ومسير الرواتب</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة دقيقة لحركات الحضور والانصراف، اضغط على أي سيلفي لعرض تفاصيله كاملة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRecords}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>تحديث البيانات</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <Download size={14} />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* تبويبات الانتقال */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'LOGS'
              ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5'
          }`}
        >
          <Camera size={15} />
          <span>سجل البصمات والصور الحية ({totalMovements})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAYROLL')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'PAYROLL'
              ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5'
          }`}
        >
          <DollarSign size={15} />
          <span>شيت مسير الرواتب (ثابت 30 يوماً)</span>
        </button>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div className="bg-white dark:bg-[#0c0e18] border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-sm dark:shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">الموظف:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">-- جميع الموظفين --</option>
            {uniqueEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">من تاريخ:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">إلى تاريخ:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">بحث سريع:</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الموظف أو الفرع..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 text-xs pl-8 focus:outline-none focus:border-orange-500"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* جدول السجلات */}
      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-white dark:bg-[#0c0e18] border border-slate-200 dark:border-white/5 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تفريغ البصمات...</p>
        </div>
      ) : activeTab === 'LOGS' ? (
        <div className="bg-white dark:bg-[#0c0e18] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 font-bold">
                <tr>
                  <th className="p-4">الموظف والكود</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4">تاريخ الوردية</th>
                  <th className="p-4 text-center">وقت الحضور</th>
                  <th className="p-4 text-center">وقت الانصراف (الأخير)</th>
                  <th className="p-4 text-center">صورة السيلفي</th>
                  <th className="p-4 text-center">الموقع والمسافة</th>
                  <th className="p-4 text-center">ساعات العمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{r.userName}</div>
                      <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">#{r.employeeCode}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{r.branchName}</td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{r.workDate}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatTime(r.checkInTime)}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatTime(r.checkOutTime)}
                    </td>
                    <td className="p-4 text-center">
                      {r.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="relative group cursor-pointer inline-block"
                          title="اضغط لتكبير الصورة وعرض التفاصيل"
                        >
                          <img
                            src={r.photoUrl}
                            alt="Selfie"
                            className="w-11 h-11 rounded-xl object-cover border-2 border-orange-500/30 group-hover:scale-110 transition shadow-sm"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Maximize2 size={13} />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        <CheckCircle2 size={11} /> {Math.round(r.gpsDistance)}م
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {r.workedMinutes > 0 ? `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* شيت مسير الرواتب (المحسوب ثابتاً على 30 يوماً) */
        <div className="bg-white dark:bg-[#0c0e18] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4 text-center">إجمالي الساعات</th>
                  <th className="p-4 text-center">الراتب الأساسي</th>
                  <th className="p-4 text-center">أجر اليوم (30 يوم)</th>
                  <th className="p-4 text-center">خصم التأخير</th>
                  <th className="p-4 text-center">الصافي التقريبي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {uniqueEmployees.map((emp) => {
                  const empLogs = filteredRecords.filter((r) => r.userId === emp.id);
                  const first = empLogs[0];
                  const basic = Number(first?.basicSalary) || 5000;
                  const dailyRate = (basic / 30).toFixed(2);
                  const totalWorkedMins = empLogs.reduce((acc, r) => acc + r.workedMinutes, 0);
                  const totalLateMins = empLogs.reduce((acc, r) => acc + r.lateMinutes, 0);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">{emp.name}</span>
                        <span className="font-mono text-orange-600 dark:text-orange-400 font-bold text-[11px]">#{first?.employeeCode}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{first?.branchName}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {(totalWorkedMins / 60).toFixed(1)} ساعة
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{basic} ج.م</td>
                      <td className="p-4 text-center font-mono text-slate-500 dark:text-slate-400">{dailyRate} ج.م/يوم</td>
                      <td className="p-4 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">-{totalLateMins} دقيقة</td>
                      <td className="p-4 text-center font-mono font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10">
                        {((totalWorkedMins / (8 * 60)) * parseFloat(dailyRate)).toFixed(2)} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة تكبير الصورة والاطلاع على تفاصيل البصمة (Modal) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0c0e18] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedRecord.userName}</h3>
                <span className="text-[11px] text-orange-400 font-mono">وردية: {selectedRecord.workDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black border border-white/5 flex items-center justify-center">
              {selectedRecord.photoUrl ? (
                <img
                  src={selectedRecord.photoUrl}
                  alt="Full Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-500">لا توجد صورة مسجلة</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-slate-400 block text-[11px]">وقت الحضور:</span>
                <span className="font-mono font-bold text-emerald-400">{formatTime(selectedRecord.checkInTime)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">وقت الانصراف (الأخير):</span>
                <span className="font-mono font-bold text-orange-400">{formatTime(selectedRecord.checkOutTime)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الفرع:</span>
                <span className="font-semibold text-slate-200">{selectedRecord.branchName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">المسافة الجغرافية:</span>
                <span className="font-mono font-bold text-slate-200">{Math.round(selectedRecord.gpsDistance)} متر</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

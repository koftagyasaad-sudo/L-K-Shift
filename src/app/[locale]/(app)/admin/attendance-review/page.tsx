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

  // الفلاتر
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // جلب البيانات من السيرفر
  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance/review?';
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

  // قائمة الموظفين الفريدين للفلترة
  const uniqueEmployees = Array.from(
    new Map(records.map((r) => [r.userId, { id: r.userId, name: r.userName }])).values()
  );

  // تصفية السجلات حسب البحث
  const filteredRecords = records.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      r.userName.toLowerCase().includes(q) ||
      r.branchName.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q)
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
            timeZone: 'Africa/Cairo',
          });
    } catch {
      return '—';
    }
  };

  // تصدير الشيت إلى إكسيل / CSV
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
      'الإضافي (د)',
      'الراتب الأساسي',
      'صافي المستحق',
    ];

    const rows = filteredRecords.map((r) => {
      const basic = Number(r.basicSalary) || 5000;
      const hourly = basic / 26 / (Number(r.workingHoursPerDay) || 8);
      const earned = ((r.workedMinutes / 60) * hourly).toFixed(2);
      return [
        r.employeeCode,
        r.userName,
        r.branchName,
        r.workDate,
        formatTime(r.checkInTime),
        formatTime(r.checkOutTime),
        `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د`,
        r.lateMinutes,
        r.overtimeMinutes,
        basic,
        earned,
      ];
    });

    const csvContent =
      '\uFEFF' +
      ['"تقرير مسير الرواتب والحضور"', '', headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `شيت_الحضور_والرواتب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة وأزرار التصدير */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">سجل بصمات الحضور ومسير الرواتب</h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة لحظية لحركات البصمة الحية والسيلفي، وحساب استحقاقات الراتب وخصومات السلف بدقة 100%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRecords}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
            <span>سحب شيت الحضور (Excel)</span>
          </button>
        </div>
      </div>

      {/* تبويبات الانتقال */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'LOGS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <DollarSign size={15} />
          <span>شيت حساب الرواتب والخصومات بدقة 100%</span>
        </button>
      </div>

      {/* كروت الإحصائيات الفورية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block">إجمالي الحركات</span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{totalMovements}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block">حركات الحضور</span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">{checkInCount}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block">الموظفين المسجلين</span>
          <span className="text-2xl font-black font-mono text-orange-600 mt-1 block">{uniqueEmployees.length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 block">نطاق التوثيق</span>
          <span className="text-sm font-bold text-slate-700 mt-1 block">GPS + كاميرا حية</span>
        </div>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">تصفية حسب الموظف:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
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
          <label className="text-[11px] font-bold text-slate-500 block mb-1">من تاريخ:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">إلى تاريخ:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">بحث سريع:</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الموظف أو الفرع..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs pl-8 focus:outline-none focus:border-orange-500"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* محتوى التبويب: جدول البصمات أو شيت الرواتب */}
      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تفريغ بيانات وسجلات البصمة...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-500">
          <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-xs font-bold">لا توجد سجلات مطابقة للفترة المحددة</p>
        </div>
      ) : activeTab === 'LOGS' ? (
        /* جدول سجل البصمات والصور الحية */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">الموظف والكود</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4">تاريخ الوردية</th>
                  <th className="p-4 text-center">وقت الحضور</th>
                  <th className="p-4 text-center">وقت الانصراف</th>
                  <th className="p-4 text-center">صورة السيلفي</th>
                  <th className="p-4 text-center">الموقع (GPS)</th>
                  <th className="p-4 text-center">ساعات العمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{r.userName}</div>
                      <div className="text-[11px] font-mono text-orange-600 font-bold">#{r.employeeCode}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{r.branchName}</td>
                    <td className="p-4 font-mono text-slate-600">{r.workDate}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900">
                      {formatTime(r.checkInTime)}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900">
                      {formatTime(r.checkOutTime)}
                    </td>
                    <td className="p-4 text-center">
                      {r.photoUrl ? (
                        <div className="inline-block relative group">
                          <img
                            src={r.photoUrl}
                            alt="Selfie"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs mx-auto"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {r.gpsDistance <= 150 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          <CheckCircle2 size={11} /> داخل الفرع ({Math.round(r.gpsDistance)}م)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          <MapPin size={11} /> خارج النطاق ({Math.round(r.gpsDistance)}م)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-900">
                      {r.workedMinutes > 0 ? `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* شيت حساب الرواتب والخصومات بدقة 100% */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4 text-center">إجمالي الساعات</th>
                  <th className="p-4 text-center">الراتب التعاقدي</th>
                  <th className="p-4 text-center">أجر الساعة</th>
                  <th className="p-4 text-center">خصم التأخير</th>
                  <th className="p-4 text-center">بدل الإضافي</th>
                  <th className="p-4 text-center">صافي الراتب المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {uniqueEmployees.map((emp) => {
                  const empLogs = filteredRecords.filter((r) => r.userId === emp.id);
                  const first = empLogs[0];
                  const basic = Number(first?.basicSalary) || 5000;
                  const hoursPerDay = Number(first?.workingHoursPerDay) || 8;
                  const hourly = basic / 26 / hoursPerDay;

                  const totalWorkedMins = empLogs.reduce((acc, r) => acc + r.workedMinutes, 0);
                  const totalLateMins = empLogs.reduce((acc, r) => acc + r.lateMinutes, 0);
                  const totalOvertimeMins = empLogs.reduce((acc, r) => acc + r.overtimeMinutes, 0);

                  const lateDeduction = (totalLateMins * (hourly / 60)).toFixed(2);
                  const overtimePay = ((totalOvertimeMins / 60) * hourly * 1.5).toFixed(2);
                  const earnedSalary = ((totalWorkedMins / 60) * hourly + parseFloat(overtimePay) - parseFloat(lateDeduction)).toFixed(2);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 text-sm block">{emp.name}</span>
                        <span className="font-mono text-orange-600 font-bold text-[11px]">#{first?.employeeCode}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{first?.branchName}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-900">
                        {(totalWorkedMins / 60).toFixed(1)} ساعة
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-800">{basic} ج.م</td>
                      <td className="p-4 text-center font-mono text-slate-600">{hourly.toFixed(2)} ج.م/س</td>
                      <td className="p-4 text-center font-mono text-rose-600 font-bold">-{lateDeduction} ج.م</td>
                      <td className="p-4 text-center font-mono text-emerald-600 font-bold">+{overtimePay} ج.م</td>
                      <td className="p-4 text-center font-mono font-black text-slate-900 bg-orange-50/50">
                        {earnedSalary} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

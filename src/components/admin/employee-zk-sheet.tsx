'use client';

import React, { useRef } from 'react';
import { 
  Printer, Download, Camera, ShieldCheck,
} from 'lucide-react';

interface ZkSheetProps {
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
  approvedAdvancesTotal: number;
}

export default function EmployeeZkSheet({
  employee,
  monthName,
  year,
  records,
  approvedAdvancesTotal = 0,
}: ZkSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // 1. العمليات الحسابية للمسير المالي
  const scheduledDays = 26;
  const dailyWage = employee.basicSalary / scheduledDays;
  const hourlyWage = dailyWage / employee.workingHoursPerDay;
  const minuteWage = hourlyWage / 60;

  const totalWorkedMinutes = records.reduce((acc, r) => acc + r.workedMinutes, 0);
  const totalWorkedHours = (totalWorkedMinutes / 60).toFixed(1);

  const totalLateMinutes = records.reduce((acc, r) => acc + r.lateMinutes, 0);
  const totalLateDeduction = (totalLateMinutes * minuteWage).toFixed(2);

  const totalOvertimeMinutes = records.reduce((acc, r) => acc + r.overtimeMinutes, 0);
  const overtimePay = ((totalOvertimeMinutes / 60) * hourlyWage * 1.5).toFixed(2);

  const unexcusedAbsenceDays = records.filter((r) => r.status === 'ABSENT').length;
  const absenceDeduction = (unexcusedAbsenceDays * dailyWage).toFixed(2);

  const approvedLeaveDays = records.filter((r) => r.status === 'APPROVED_LEAVE').length;

  // صافي الراتب المستحق
  const netSalary = (
    employee.basicSalary +
    parseFloat(overtimePay) -
    parseFloat(totalLateDeduction) -
    parseFloat(absenceDeduction) -
    approvedAdvancesTotal
  ).toFixed(2);

  // 2. أمر الطباعة المباشرة
  const handlePrint = () => {
    window.print();
  };

  // 3. استخراج وتنزيل ملف Excel / CSV باللغة العربية
  const handleExportCSV = () => {
    const headers = [
      'اليوم',
      'التاريخ',
      'الوردية',
      'الحضور',
      'الانصراف',
      'إثبات الموقع (GPS)',
      'إثبات الصورة',
      'ساعات العمل الفعلية',
      'دقائق التأخير',
      'ساعات الإضافي',
      'الحالة والاعتماد',
    ];

    const rows = records.map((r) => [
      r.dayName,
      r.date,
      `"${r.shiftSchedule}"`,
      r.checkInTime || '—',
      r.checkOutTime || '—',
      r.checkInTime
        ? r.gpsVerified
          ? `مطابق (${r.gpsDistance}م)`
          : `خارج النطاق (${r.gpsDistance}م)`
        : '—',
      r.photoUrl ? 'موثقة' : '—',
      `"${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د"`,
      r.lateMinutes,
      (r.overtimeMinutes / 60).toFixed(1),
      r.status === 'PRESENT'
        ? 'حاضر'
        : r.status === 'APPROVED_LEAVE'
        ? 'إجازة معتمدة (مدفوعة)'
        : r.status === 'WEEKLY_OFF'
        ? 'عطلة أسبوعية'
        : 'غياب غير مسجل',
    ]);

    const csvContent =
      '\uFEFF' +
      [
        `"تقرير دوام وحضور: ${employee.name} (كود: #${employee.employeeCode})"`,
        `"الفرع: ${employee.branchName} - الفترة: ${monthName} لسنة ${year}"`,
        `"الراتب الأساسي: ${employee.basicSalary} ج.م - صافي الراتب المستحق: ${netSalary} ج.م"`,
        '',
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `شيت_حضور_${employee.name.replace(/\s+/g, '_')}_${monthName}_${year}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* شريط الإجراءات: يحتوي على زري الطباعة والاستخراج */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white">تقرير الحضور التفصيلي ومسير الرواتب (ZK-Standard)</h2>
          <p className="text-xs text-slate-400 mt-0.5">تفريغ ساعات العمل، إثباتات الـ GPS والكاميرا، والتصفية المالية</p>
        </div>

        <div className="flex items-center gap-3">
          {/* زر 1: طباعة الشيت */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer shadow-md"
          >
            <Printer size={16} className="text-orange-400" />
            <span>طباعة الشيت</span>
          </button>

          {/* زر 2: استخراج أو حفظ ملف Excel */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <Download size={16} />
            <span>استخراج وحفظ الملف (Excel)</span>
          </button>
        </div>
      </div>

      {/* مستند الشيت (ZK Formatted Sheet) */}
      <div
        ref={sheetRef}
        className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-xl print:p-0 print:border-none print:shadow-none"
      >
        {/* الترويسة الرئيسية */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">L-K SHIFT CORE</h1>
            <p className="text-xs font-semibold text-slate-500">نظام إدارة البصمة الذكية وحساب الرواتب الميدانية</p>
            <p className="text-xs font-bold text-orange-600 mt-1">فرع التعيين: {employee.branchName}</p>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800">بيان تفريغ الدوام الشهري</h3>
            <p className="text-xs font-semibold text-slate-600">الفترة: شهر {monthName} لسنة {year}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700">
              <ShieldCheck size={12} className="text-emerald-600" /> موثق ببصمة الوجه وموقع الـ GPS
            </div>
          </div>
        </div>

        {/* كارت بيانات الموظف والتعاقد */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
          <div>
            <span className="text-slate-500 block">اسم الموظف:</span>
            <span className="font-bold text-sm text-slate-900">{employee.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">الكود الوظيفي (ID):</span>
            <span className="font-mono font-bold text-sm text-orange-600">#{employee.employeeCode}</span>
          </div>
          <div>
            <span className="text-slate-500 block">المسمى الوظيفي:</span>
            <span className="font-bold text-slate-900">{employee.role}</span>
          </div>
          <div>
            <span className="text-slate-500 block">ساعات الوردية اليومية:</span>
            <span className="font-bold text-slate-900">{employee.workingHoursPerDay} ساعات / يومياً</span>
          </div>
        </div>

        {/* جدول سجل الأيام بتفاصيل ZK */}
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px]">
                <th className="p-2.5 border border-slate-800">التاريخ</th>
                <th className="p-2.5 border border-slate-800">الوردية</th>
                <th className="p-2.5 border border-slate-800 text-center">حضور</th>
                <th className="p-2.5 border border-slate-800 text-center">انصراف</th>
                <th className="p-2.5 border border-slate-800 text-center">الـ GPS</th>
                <th className="p-2.5 border border-slate-800 text-center">صورة البصمة</th>
                <th className="p-2.5 border border-slate-800 text-center">العمل الفعلي</th>
                <th className="p-2.5 border border-slate-800 text-center">تأخير</th>
                <th className="p-2.5 border border-slate-800 text-center">إضافي</th>
                <th className="p-2.5 border border-slate-800">الحالة والاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {records.map((r, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  <td className="p-2 border border-slate-200 whitespace-nowrap">
                    <span className="font-bold">{r.dayName}</span>
                    <span className="text-slate-500 block text-[10px]">{r.date}</span>
                  </td>
                  <td className="p-2 border border-slate-200 whitespace-nowrap text-slate-600">{r.shiftSchedule}</td>
                  
                  <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                    {r.checkInTime || '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                    {r.checkOutTime || '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center">
                    {r.checkInTime ? (
                      r.gpsVerified ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                          مطابق ({r.gpsDistance}م)
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
                          خارج النطاق ({r.gpsDistance}م)
                        </span>
                      )
                    ) : '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center">
                    {r.photoUrl ? (
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold flex items-center justify-center gap-1">
                        <Camera size={11} /> موثقة
                      </span>
                    ) : '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                    {r.workedMinutes > 0 ? `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د` : '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center font-mono text-rose-600 font-bold">
                    {r.lateMinutes > 0 ? `${r.lateMinutes} د` : '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-center font-mono text-emerald-600 font-bold">
                    {r.overtimeMinutes > 0 ? `${(r.overtimeMinutes / 60).toFixed(1)} س` : '—'}
                  </td>

                  <td className="p-2 border border-slate-200 text-xs">
                    {r.status === 'PRESENT' && <span className="text-emerald-700 font-bold">حاضر</span>}
                    {r.status === 'APPROVED_LEAVE' && (
                      <span className="text-blue-700 font-bold">إجازة معتمدة (مدفوعة)</span>
                    )}
                    {r.status === 'ABSENT' && <span className="text-rose-600 font-bold">غياب غير مسجل</span>}
                    {r.status === 'WEEKLY_OFF' && <span className="text-slate-400 font-bold">عطلة أسبوعية</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* شريط الإجماليات والمستحقات المالية */}
        <div className="mt-6 border-t-2 border-slate-900 pt-4">
          <h4 className="font-black text-sm text-slate-900 mb-3">الملخص المالي ومسير الراتب النهائي</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">إجمالي ساعات العمل الفعلية:</span>
              <span className="text-base font-black font-mono text-slate-900">{totalWorkedHours} ساعة</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">الإجازات المعتمدة (المدفوعة):</span>
              <span className="text-base font-black text-blue-700">{approvedLeaveDays} يوم (بدون خصم)</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-600 block">إجمالي خصومات التأخير ({totalLateMinutes} دقيقة):</span>
              <span className="text-base font-black font-mono text-rose-700">-{totalLateDeduction} ج.م</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-600 block">خصم الغياب ({unexcusedAbsenceDays} يوم):</span>
              <span className="text-base font-black font-mono text-rose-700">-{absenceDeduction} ج.م</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-6">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-700 block">مستحقات العمل الإضافي:</span>
              <span className="text-base font-black font-mono text-emerald-800">+{overtimePay} ج.م</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-700 block">السلف المالية المعتمدة المصروفة:</span>
              <span className="text-base font-black font-mono text-amber-900">-{approvedAdvancesTotal} ج.م</span>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl">
              <span className="text-slate-600 block">الراتب الأساسي التعاقدي:</span>
              <span className="text-base font-black font-mono text-slate-900">{employee.basicSalary} ج.م</span>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-xl shadow-md">
              <span className="text-white/80 block font-bold">صافي الراتب المستحق للصرف:</span>
              <span className="text-lg font-black font-mono">{netSalary} ج.م</span>
            </div>
          </div>

          {/* التوقيعات الرسمية */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
            <div>
              <p className="font-bold mb-8">إعداد ومراجعة مدير الفرع</p>
              <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
            </div>
            <div>
              <p className="font-bold mb-8">اعتماد شؤون العاملين (HR)</p>
              <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
            </div>
            <div>
              <p className="font-bold mb-8">اعتماد الإدارة المالية والمدير العام</p>
              <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { 
  Building2, Calendar, DollarSign, Download, Filter, 
  MapPin, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';

interface EmployeeSalaryRow {
  userId: number | string;
  name: string;
  role: string;
  branchName: string;
  workingHoursPerDay: number;
  basicSalary: number;
  workedDays: number;
  workedHours: number;
  approvedLeaveDays: number;
  overtimeHours: number;
  lateMinutes: number;
  advanceDeductions: number;
}

export function AttendanceReviewList({ initialData = [] }: { initialData?: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [loading, setLoading] = useState(false);

  // حساب الأجر وصافي الراتب الدقيق لكل موظف
  const calculateRow = (emp: any) => {
    const basic = Number(emp.basicSalary) || 0;
    const hoursPerDay = Number(emp.workingHoursPerDay) || 8;
    const scheduledMonthlyHours = hoursPerDay * 26; // 26 يوم عمل شهرياً
    const hourlyRate = scheduledMonthlyHours > 0 ? basic / scheduledMonthlyHours : 0;
    const minuteRate = hourlyRate / 60;

    const workedHours = Number(emp.workedHours) || 0;
    const approvedLeaveHours = (Number(emp.approvedLeaveDays) || 0) * hoursPerDay; // الإجازات المعتمدة مدفوعة بالكامل
    const overtimeHours = Number(emp.overtimeHours) || 0;
    const lateMinutes = Number(emp.lateMinutes) || 0;
    const advanceDeductions = Number(emp.advanceDeductions) || 0;

    // استحقاق ساعات العمل الفعلية + الإجازات المدفوعة
    const earnedBasePay = (workedHours + approvedLeaveHours) * hourlyRate;
    const overtimePay = overtimeHours * (hourlyRate * 1.5);
    const lateDeduction = lateMinutes * minuteRate;

    // صافي الراتب المستحق الفعلي
    let netSalary = earnedBasePay + overtimePay - lateDeduction - advanceDeductions;
    if (netSalary < 0) netSalary = 0;

    return {
      hourlyRate: hourlyRate.toFixed(2),
      earnedBasePay: earnedBasePay.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      lateDeduction: lateDeduction.toFixed(2),
      netSalary: Math.round(netSalary),
    };
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* التنبيه الإرشادي */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-xs flex items-center justify-between">
        <span>* يتم احتساب الراتب آلياً: (ساعات العمل الفعلية + الإجازات المعتمدة) × أجر الساعة + الإضافي - التأخير - السلف.</span>
      </div>

      {/* جدول المسير المالي الدقيق */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">الموظف والفرع</th>
              <th className="p-4 text-center">الوردية المقررة</th>
              <th className="p-4 text-center">الراتب الأساسي</th>
              <th className="p-4 text-center">أجر الساعة</th>
              <th className="p-4 text-center">أيام وساعات العمل</th>
              <th className="p-4 text-center">الإجازات المعتمدة</th>
              <th className="p-4 text-center">الإضافي</th>
              <th className="p-4 text-center">خصم السلف</th>
              <th className="p-4 text-center font-black text-white">صافي الراتب المستحق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {initialData.map((emp: any, idx: number) => {
              const calc = calculateRow(emp);
              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white">
                    <div>{emp.name}</div>
                    <div className="text-[11px] text-slate-400">{emp.role} - {emp.branchName}</div>
                  </td>
                  <td className="p-4 text-center">{emp.workingHoursPerDay} س / يوم</td>
                  <td className="p-4 text-center font-mono font-bold">{emp.basicSalary} ج.م</td>
                  <td className="p-4 text-center font-mono text-slate-400">{calc.hourlyRate} ج.م</td>
                  <td className="p-4 text-center font-mono font-bold text-blue-400">
                    {emp.workedDays || 0} يوم ({emp.workedHours || 0} س)
                  </td>
                  <td className="p-4 text-center text-emerald-400 font-bold">
                    {emp.approvedLeaveDays > 0 ? `${emp.approvedLeaveDays} يوم (مدفوع)` : '—'}
                  </td>
                  <td className="p-4 text-center text-emerald-400 font-mono">
                    {emp.overtimeHours > 0 ? `+${calc.overtimePay} ج.م` : '—'}
                  </td>
                  <td className="p-4 text-center text-amber-500 font-mono font-bold">
                    {emp.advanceDeductions > 0 ? `-${emp.advanceDeductions} ج.م` : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm px-3 py-1.5 rounded-xl">
                      {calc.netSalary} ج.م
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendanceReviewList;

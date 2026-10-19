"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, User, Calendar, Clock, DollarSign, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { getEmployeesAction, EmployeeData } from "@/actions/employeeActions";
import { getAttendanceLogsAction, AttendanceRecord } from "@/actions/attendanceActions";

export default function EmployeeDetailPage() {
  const params = useParams();
  const empId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedDate] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!empId) return;
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        getEmployeesAction(),
        getAttendanceLogsAction(empId)
      ]);

      if (empRes.success) {
        const found = empRes.data.find((e) => e.id === empId);
        if (found) setEmployee(found);
      }
      if (attRes.success) {
        setLogs(attRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, [empId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">جاري تحميل تقرير الموظف...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">الموظف غير موجود</h2>
        <Link href="/ar/admin/employees" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs">
          <ArrowRight className="w-4 h-4" /> العودة لقائمة الموظفين
        </Link>
      </div>
    );
  }

  // حسابات الأوفرتايم تلقائياً
  const actualWorkedDays = logs.length;
  const leaveDaysAllowed = employee.monthly_leave_days || 2;
  const actualLeavesTaken = Math.max(0, 30 - actualWorkedDays);
  const unusedLeaves = Math.max(0, leaveDaysAllowed - actualLeavesTaken);
  
  // قيمة اليوم الأوفر تايم = (الراتب الأساسي / 30) * 1.5
  const dailyRate = (employee.base_salary || 5000) / 30;
  const overtimeBonus = unusedLeaves * (dailyRate * 1.5);

  return (
    <div className="p-6 space-y-6">
      <Link href="/ar/admin/employees" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-orange-500">
        <ArrowRight className="w-4 h-4" /> العودة لقائمة الموظفين
      </Link>

      {/* Header Info Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{employee.name}</h1>
            <p className="text-xs text-slate-500 mt-1">كود الموظف: {employee.code} | {employee.branch_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-xl text-left">
            <span className="text-[10px] text-slate-400 block font-semibold">مكافأة الأوفر تايم المستحقة</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{overtimeBonus.toFixed(2)} ر.س</span>
          </div>
        </div>
      </div>

      {/* Calculations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-1">الراتب الأساسي</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{employee.base_salary} ر.س</span>
        </div>

        <div className="p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-1">رصيد الإجازات الشهري</span>
          <span className="text-xl font-bold text-amber-600">{employee.monthly_leave_days} يوم/شهر</span>
        </div>

        <div className="p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-1">أيام الحضور الفعلية</span>
          <span className="text-xl font-bold text-blue-600">{actualWorkedDays} يوم</span>
        </div>

        <div className="p-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-1">أيام الإجازة غير المستغلة (أوفر تايم)</span>
          <span className="text-xl font-bold text-emerald-600">{unusedLeaves.toFixed(1)} يوم</span>
        </div>
      </div>

      {/* Detailed Fingerprint Logs Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">سجل بصمات الحضور والانصراف التفصيلي</h3>
          <input
            type="date"
            value={selectedMonth}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3">تاريخ ووقت الدخول</th>
                <th className="p-3">وقت الخروج</th>
                <th className="p-3">بصمة الوجه</th>
                <th className="p-3">احداثيات الـ GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="p-3 font-semibold text-emerald-600">{new Date(log.check_in).toLocaleString("ar-SA")}</td>
                  <td className="p-3 text-slate-500">{log.check_out ? new Date(log.check_out).toLocaleString("ar-SA") : "قيد الشيفت"}</td>
                  <td className="p-3">
                    {log.face_verified ? <span className="text-blue-600 font-bold">✓ مؤكدة</span> : "عادي"}
                  </td>
                  <td className="p-3 font-mono text-slate-400">{log.gps_lat}, {log.gps_lng}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

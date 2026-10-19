"use client";

import React, { useState, useEffect } from "react";
import { Clock, Search, Calendar, CheckCircle2, ShieldCheck, MapPin, UserCheck, Loader2 } from "lucide-react";
import { getAttendanceLogsAction, AttendanceRecord } from "@/actions/attendanceActions";

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const res = await getAttendanceLogsAction();
      if (res.success) setLogs(res.data);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesName = (log.employee_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || (log.check_in && log.check_in.startsWith(selectedDate));
    return matchesName && matchesDate;
  });

  const totalPresent = logs.filter(l => l.status === "نشط" || l.status === "منتهي").length;
  const verifiedFaceCount = logs.filter(l => l.face_verified).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-xl shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">سجل الحضور والانصراف العام</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">متابعة دقيقة لبصمات الوجه والموقع الجغرافي (3m GPS) لجميع الموظفين</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">إجمالي البصمات</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{logs.length}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">الحاضرون اليوم</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalPresent}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">موثقة بالوجه (Face ID)</span>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{verifiedFaceCount}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/40 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الموظف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="relative">
          <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-800 rounded-xl border text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">جاري جلب سجلات الحضور...</p>
        </div>
      ) : (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">الفرع</th>
                  <th className="p-3.5">وقت الدخول</th>
                  <th className="p-3.5">وقت الخروج</th>
                  <th className="p-3.5">توثيق الوجه</th>
                  <th className="p-3.5">النطاق الجغرافي</th>
                  <th className="p-3.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{log.employee_name}</td>
                    <td className="p-3.5">{log.branch_name}</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-semibold">
                      {new Date(log.check_in).toLocaleTimeString("ar-SA")}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {log.check_out ? new Date(log.check_out).toLocaleTimeString("ar-SA") : "لم يسجل انصراف"}
                    </td>
                    <td className="p-3.5">
                      {log.face_verified ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-md font-medium text-[11px] flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" /> مؤكد بالوجه
                        </span>
                      ) : (
                        <span className="text-slate-400">عادي</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {log.gps_lat.toFixed(4)}, {log.gps_lng.toFixed(4)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.status === "نشط" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

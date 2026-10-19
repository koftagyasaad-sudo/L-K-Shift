"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  Search,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  UserCheck,
  Loader2,
  Filter,
} from "lucide-react";
import { getAttendanceLogsAction, AttendanceRecord } from "@/actions/attendanceActions";

export default function AttendanceReviewPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceLogsAction();
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.employee_name && log.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.employee_code && log.employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.branch_name && log.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate =
      !filterDate ||
      (log.created_at && log.created_at.startsWith(filterDate));

    return matchesSearch && matchesDate;
  });

  const totalLogs = filteredLogs.length;
  const inLogsCount = filteredLogs.filter((l) => l.action_type === "IN").length;
  const faceVerifiedCount = filteredLogs.filter((l) => l.face_verified).length;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl border border-orange-200/80 dark:border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-white dark:to-zinc-900 backdrop-blur-xl p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? "سجل بصمات الحضور والإنصراف" : "Attendance & Fingerprint Review"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "متابعة فورية للحركات المسجلة عبر البصمة والتحقق بالوجه"
              : "Real-time monitoring of attendance logs & Face ID verification"}
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
          <span>{isAr ? "تحديث البيانات" : "Refresh Data"}</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{isAr ? "إجمالي التسجيلات" : "Total Logs"}</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalLogs}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{isAr ? "حركات الدخول" : "Check-in Count"}</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{inLogsCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{isAr ? "التحقق بالوجه (Face ID)" : "Face Verified"}</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{faceVerifiedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "ابحث باسم الموظف، الكود، أو الفرع..." : "Search employee name, code, or branch..."}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs">{isAr ? "جاري تحميل سجل البصمات..." : "Loading fingerprint logs..."}</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
            <Filter className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-medium">{isAr ? "لا توجد سجلات متطابقة مع البحث" : "No matching attendance logs found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-orange-50/50 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-400">
                  <th className="p-4 text-start font-semibold">{isAr ? "الموظف" : "Employee"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الفرع" : "Branch"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "نوع الحركة" : "Type"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "التحقق بـ Face ID" : "Face ID"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "الموقع الجغرافي" : "GPS Location"}</th>
                  <th className="p-4 text-start font-semibold">{isAr ? "التاريخ والوقت" : "Date & Time"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/30 dark:hover:bg-zinc-800/30 transition">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {log.employee_name || (isAr ? "غير معرّف" : "Unknown")}
                        </p>
                        {log.employee_code && (
                          <span className="text-[10px] text-zinc-400 block">{log.employee_code}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">
                      {log.branch_name || (isAr ? "غير محدد" : "Unspecified")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          log.action_type === "IN"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {log.action_type === "IN" ? (isAr ? "دخول" : "Check-in") : (isAr ? "خروج" : "Check-out")}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.face_verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isAr ? "مطابق" : "Verified"}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">{isAr ? "عادي" : "Standard"}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {log.latitude && log.longitude ? (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">{isAr ? "غير متاح" : "N/A"}</span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString(isAr ? "ar-EG" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
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

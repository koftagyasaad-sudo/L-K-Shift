"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Download,
  Loader2,
  Play,
} from "lucide-react";
import { getBranchByIdAction } from "@/actions/branchActions";
import { getAttendanceLogsAction } from "@/actions/attendanceActions";
import type { BranchData, AttendanceRecord } from "@/types";

export default function BranchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";
  const branchId = params?.id as string;

  const [branch, setBranch] = useState<BranchData | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bRes, attRes] = await Promise.all([
          getBranchByIdAction(branchId),
          getAttendanceLogsAction({ branchId }),
        ]);

        if (bRes.success && bRes.branch) {
          setBranch(bRes.branch);
        }
        if (attRes.success && attRes.logs) {
          setAttendanceLogs(attRes.logs);
        }
      } catch (err) {
        console.error("Error loading branch details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (branchId) loadData();
  }, [branchId]);

  const exportCSV = () => {
    if (!attendanceLogs.length) return;
    const headers = isAr
      ? ["الموظف", "نوع الحركة", "البصمة الموثقة", "التاريخ"]
      : ["Employee", "Type", "Face Verified", "Date"];

    const rows = attendanceLogs.map((l) => [
      l.employee_name || "",
      l.action_type,
      l.face_verified ? "Yes" : "No",
      new Date(l.created_at).toLocaleString(),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `branch_attendance_${branchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm font-medium">{isAr ? "جاري تحميل تفاصيل الفرع..." : "Loading branch details..."}</p>
      </div>
    );
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-orange-600 transition"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isAr ? "الرجوع للفروع" : "Back to Branches"}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-orange-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
          </button>

          <button
            onClick={() => alert(isAr ? "تم بدء وردية عمل جديدة لهذا الفرع" : "Shift started!")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold shadow-md hover:from-orange-600 hover:to-pink-600 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isAr ? "بدء وردية جديدة" : "Start Shift"}</span>
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="rounded-3xl border border-orange-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{branch?.name || (isAr ? "الفرع" : "Branch")}</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>{branch?.location || branch?.address || (isAr ? "الموقع غير محدد" : "No location specified")}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{isAr ? "سجل حضور موظفي الفرع" : "Branch Fingerprint Logs"}</span>
          </h3>
          <span className="text-xs text-zinc-400 font-semibold">{attendanceLogs.length} {isAr ? "حركة" : "logs"}</span>
        </div>

        {attendanceLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Users className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-xs font-semibold">{isAr ? "لا توجد حركات حضور مسجلة لهذا الفرع" : "No attendance logs for this branch"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-orange-50/50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400">
                  <th className="p-3 text-start font-semibold">{isAr ? "الموظف" : "Employee"}</th>
                  <th className="p-3 text-start font-semibold">{isAr ? "نوع الحركة" : "Action"}</th>
                  <th className="p-3 text-start font-semibold">{isAr ? "بصمة الوجه" : "Face ID"}</th>
                  <th className="p-3 text-start font-semibold">{isAr ? "التاريخ والوقت" : "Timestamp"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/30 transition">
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{log.employee_name || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${log.action_type === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {log.action_type === "IN" ? (isAr ? "دخول" : "IN") : (isAr ? "خروج" : "OUT")}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-600">{log.face_verified ? (isAr ? "مطابق" : "Yes") : "—"}</td>
                    <td className="p-3 font-mono text-[11px] text-zinc-500">
                      {new Date(log.created_at).toLocaleString()}
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

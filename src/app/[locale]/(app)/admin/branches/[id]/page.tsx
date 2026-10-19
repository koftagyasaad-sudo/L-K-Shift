"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getBranchByIdAction } from "@/actions/branchActions";
import { getAttendanceLogsAction } from "@/actions/attendanceActions";
import type { BranchData, AttendanceRecord } from "@/types";
import {
  Building2,
  MapPin,
  Phone,
  UserCheck,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  PhoneCall,
} from "lucide-react";

export default function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const isRtl = locale === "ar";

  const [branch, setBranch] = useState<BranchData | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bRes, attRes] = await Promise.all([
          getBranchByIdAction(id),
          getAttendanceLogsAction({ branchId: id }),
        ]);

        if (bRes.success && bRes.branch) {
          setBranch(bRes.branch as BranchData);
        } else {
          setError(bRes.error || "تعذر جلب بيانات الفرع");
        }

        if (attRes.success && attRes.logs) {
          setAttendanceLogs(attRes.logs as AttendanceRecord[]);
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-gray-500 font-medium">
            {isRtl ? "جاري تحميل تفاصيل الفرع..." : "Loading branch details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-bold mb-2">
            {isRtl ? "خطأ في جلب الفرع" : "Error Loading Branch"}
          </h3>
          <p className="mb-4">{error || (isRtl ? "الفرع غير موجود" : "Branch not found")}</p>
          <Link
            href={`/${locale}/admin/branches`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:opacity-90 transition-all"
          >
            <ArrowRight className={`w-4 h-4 ${isRtl ? "" : "rotate-180"}`} />
            {isRtl ? "العودة لقائمة الفروع" : "Back to Branches"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/admin/branches`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors font-medium text-sm"
        >
          <ArrowRight className={`w-4 h-4 ${isRtl ? "" : "rotate-180"}`} />
          {isRtl ? "العودة للفروع" : "Back to Branches"}
        </Link>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
          {branch.name}
        </span>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">{branch.name}</h1>
                <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" />
                  {branch.location || (isRtl ? "الموقع غير محدد" : "Location not set")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center md:text-right">
            <p className="text-xs text-white/80">{isRtl ? "نطاق الحضور الجغرافي" : "GPS Radius"}</p>
            <p className="text-2xl font-black">{branch.radius_meters || 100} m</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                {isRtl ? "مدير الفرع" : "Branch Manager"}
              </p>
              <h4 className="text-base font-bold text-gray-900 mt-1">
                {branch.manager || (isRtl ? "غير معين" : "Not Assigned")}
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                {isRtl ? "رقم الهاتف" : "Phone Number"}
              </p>
              <h4 className="text-base font-bold text-gray-900 mt-1" dir="ltr">
                {branch.phone || (isRtl ? "غير متوفر" : "N/A")}
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                {isRtl ? "التحويلة الداخلية" : "Extension"}
              </p>
              <h4 className="text-base font-bold text-gray-900 mt-1" dir="ltr">
                {branch.ext || (isRtl ? "غير محدد" : "N/A")}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isRtl ? "سجل الحضور والانصراف بالفرع" : "Branch Attendance Logs"}
              </h3>
              <p className="text-xs text-gray-500">
                {isRtl ? "آخر تسجيلات الحضور لهذا الفرع" : "Recent attendance records for this branch"}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            {attendanceLogs.length} {isRtl ? "تسجيل" : "records"}
          </span>
        </div>

        {attendanceLogs.length === 0 ? (
          <div className="text-center py-10 text-gray-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-gray-300" />
            <p className="font-medium text-sm">
              {isRtl ? "لا توجد تسجيلات حضور لهذا الفرع حالياً" : "No attendance logs for this branch yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="p-3">{isRtl ? "الموظف" : "Employee"}</th>
                  <th className="p-3">{isRtl ? "نوع الحركة" : "Type"}</th>
                  <th className="p-3">{isRtl ? "التاريخ والوقت" : "Date & Time"}</th>
                  <th className="p-3 text-center">{isRtl ? "التحقق من الوجه" : "Face Verified"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="p-3 font-semibold text-gray-800">
                      {log.employee_name || log.employee_id}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          log.action_type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.action_type === "IN"
                          ? isRtl
                            ? "حضور"
                            : "Check In"
                          : isRtl
                          ? "انصراف"
                          : "Check Out"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-xs" dir="ltr">
                      {new Date(log.created_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                    </td>
                    <td className="p-3 text-center">
                      {log.face_verified ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          <ShieldCheck className="w-4 h-4" />
                          {isRtl ? "موثق" : "Verified"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium text-xs bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                          {isRtl ? "عادي" : "Standard"}
                        </span>
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
  );
}

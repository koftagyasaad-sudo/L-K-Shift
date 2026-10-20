"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, Fingerprint, ArrowRight, Loader2 } from "lucide-react";
import { CheckInOutWidget } from "@/components/attendance/check-in-out-widget";

export default function AttendanceMainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isRtl = locale === "ar";

  const [activeModal, setActiveModal] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/attendance/today");
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.record);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <Clock className="w-16 h-16 mb-4 opacity-90 animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            {isRtl ? "شاشة تسجيل الحضور والانصراف" : "Attendance Terminal"}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm">
            {isRtl ? "يرجى تفعيل الموقع الجغرافي والكاميرا قبل التسجيل" : "Please enable GPS and Camera to log attendance"}
          </p>
        </div>
      </div>

      {/* الحالة الحالية اليوم */}
      {!loading && todayRecord && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 text-center shadow-xs">
          <p className="text-xs font-bold text-gray-500">
            {isRtl ? "حالة اليوم:" : "Today Status:"}{" "}
            <span className="text-orange-500 font-black">
              {todayRecord.checkInTime ? (isRtl ? "تم تسجيل الحضور" : "Checked In") : (isRtl ? "لم يتم التسجيل" : "Not Checked In")}
              {todayRecord.checkOutTime && (isRtl ? " | تم الانصراف" : " | Checked Out")}
            </span>
          </p>
        </div>
      )}

      {/* أزرار الحضور والانصراف التفاعلية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <button
          onClick={() => setActiveModal("CHECK_IN")}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all flex flex-col items-center gap-4 group cursor-pointer"
        >
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full group-hover:scale-110 transition-transform">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRtl ? "تسجيل حضور" : "Check In"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isRtl ? "تسجيل بداية الوردية الخاصة بك مع الـ GPS والكاميرا" : "Log the start of your shift with GPS & Camera"}
          </p>
        </button>

        <button
          onClick={() => setActiveModal("CHECK_OUT")}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-rose-500 transition-all flex flex-col items-center gap-4 group cursor-pointer"
        >
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full group-hover:scale-110 transition-transform">
            <Fingerprint className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRtl ? "تسجيل انصراف" : "Check Out"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isRtl ? "تسجيل نهاية الوردية الخاصة بك مع الـ GPS والكاميرا" : "Log the end of your shift with GPS & Camera"}
          </p>
        </button>
      </div>

      <div className="text-center mt-6">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors"
        >
          <ArrowRight className={`w-4 h-4 ${isRtl ? "" : "rotate-180"}`} />
          {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </Link>
      </div>

      {/* Modal الكاميرا والـ GPS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CheckInOutWidget
            initialType={activeModal}
            locale={isRtl ? "ar" : "en"}
            onClose={() => setActiveModal(null)}
            onSuccess={() => fetchTodayStatus()}
          />
        </div>
      )}
    </div>
  );
}

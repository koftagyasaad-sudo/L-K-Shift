"use client";

import { use } from "react";
import Link from "next/link";
import { Clock, CheckCircle, Fingerprint, ArrowRight } from "lucide-react";

export default function AttendanceMainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isRtl = locale === "ar";

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <Clock className="w-16 h-16 mb-4 opacity-90" />
          <h1 className="text-3xl font-black mb-2">{isRtl ? "شاشة تسجيل الحضور والانصراف" : "Attendance Terminal"}</h1>
          <p className="text-white/80">{isRtl ? "يرجى تفعيل الموقع الجغرافي والكاميرا قبل التسجيل" : "Please enable GPS and Camera to log attendance"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <button className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-orange-500 transition-all flex flex-col items-center gap-4 group">
          <div className="p-4 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-full group-hover:scale-110 transition-transform">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isRtl ? "تسجيل حضور" : "Check In"}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{isRtl ? "تسجيل بداية الوردية الخاصة بك" : "Log the start of your shift"}</p>
        </button>

        <button className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-pink-500 transition-all flex flex-col items-center gap-4 group">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full group-hover:scale-110 transition-transform">
            <Fingerprint className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isRtl ? "تسجيل انصراف" : "Check Out"}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{isRtl ? "تسجيل نهاية الوردية الخاصة بك" : "Log the end of your shift"}</p>
        </button>
      </div>

      <div className="text-center mt-6">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
          <ArrowRight className={`w-4 h-4 ${isRtl ? "" : "rotate-180"}`} />
          {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </Link>
      </div>
    </div>
  );
}

"use client";

import React, { useContext, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";

export default function BranchDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const resolvedParams = use(params);
  const branchId = resolvedParams.id;

  const { isDarkMode } = useContext(ThemeContext);
  const pathname = usePathname();
  const currentLocale = pathname.startsWith("/en") ? "en" : "ar";

  const cardClass = `rounded-2xl p-6 border transition-all ${
    isDarkMode ? "bg-[#111111] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${currentLocale}/admin/branches`}
            className={`p-2.5 rounded-xl border transition-all ${
              isDarkMode ? "border-gray-800 bg-[#141414] hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black">تفاصيل الفرع #{branchId}</h1>
              <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-mono font-bold px-3 py-1 rounded-full">
                ID: {branchId}
              </span>
            </div>
            <p className={isDarkMode ? "text-gray-400 mt-1" : "text-gray-500 mt-1"}>
              متابعة الورديات والموظفين والنشاط المالي الخاص بهذا الفرع
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cardClass}>
          <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>الموظفين المسجلين بالفرع</p>
          <p className="text-3xl font-black text-orange-500">12 موظف</p>
        </div>
        <div className={cardClass}>
          <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>الورديات اليومية</p>
          <p className="text-3xl font-black text-emerald-500">3 ورديات نشطة</p>
        </div>
        <div className={cardClass}>
          <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>حالة الفرع</p>
          <p className="text-3xl font-black text-blue-500">مفتوح الآن</p>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="font-extrabold text-xl mb-4">بيانات وإحصائيات الفرع #{branchId}</h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          أنت الآن تتصفح المجلد الديناميكي للفرع بالمعرف الفريد <code className="font-mono text-orange-500 font-bold">[{branchId}]</code>. يمكنك من هنا متابعة تقارير المبيعات، ومراقبة حضور وانصراف الموظفين التابعين لهذا الفرع تحديداً.
        </p>
      </div>
    </div>
  );
}

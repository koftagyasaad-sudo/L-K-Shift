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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <h1 className="text-3xl font-black">إدارة عمليات الفرع #{branchId}</h1>
          </div>
        </div>
        
        {/* Actions Moved Here as Requested */}
        <div className="flex items-center gap-3">
          <button className={`px-5 py-2.5 rounded-xl font-bold border transition-colors flex items-center gap-2 ${
            isDarkMode ? "border-gray-700 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-900"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            تصدير تقرير الفرع
          </button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            بدء وردية بالفرع
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="font-extrabold text-xl mb-4">الورديات الحالية للفرع</h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          سيتم إدراج جدول الورديات والموظفين المربوطين بهذا الفرع هنا بناءً على عمليات تسجيل الحضور الجغرافي.
        </p>
      </div>
    </div>
  );
}

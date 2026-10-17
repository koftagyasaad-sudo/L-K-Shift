import React from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
      {/* ==================== 1. هيدر النظام (تغيير اللغة والمود) ==================== */}
      <header className="bg-[#141414] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* الشعار واسم البرنامج */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
              LK
            </div>
            <span className="font-bold text-lg tracking-wide">L-K-Shift</span>
          </div>

          {/* عناصر التحكم العلوية */}
          <div className="flex items-center gap-3">
            
            {/* زر تغيير المظهر (ليلي / نهاري) */}
            <button 
              className="p-2.5 rounded-xl border border-gray-800 bg-[#1e1e1e] text-yellow-400 hover:bg-gray-800 transition-all"
              title="تغيير المظهر"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </button>

            {/* زر تغيير اللغة */}
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-800 bg-[#1e1e1e] text-gray-200 hover:bg-gray-800 text-xs font-semibold transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/><path d="M2 12h20"/></svg>
              English / العربية
            </button>

            {/* الملف الشخصي */}
            <div className="w-9 h-9 rounded-xl border border-gray-800 bg-[#1e1e1e] flex items-center justify-center font-bold text-xs text-blue-400">
              مأ
            </div>
          </div>

        </div>
      </header>

      {/* ==================== 2. عرض محتوى الصفحة المباشر ==================== */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

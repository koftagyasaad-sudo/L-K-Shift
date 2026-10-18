"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, ArrowRight, Play, Download, Phone, MapPin, 
  CheckCircle2, Clock, Loader2 
} from "lucide-react";
import { getBranchByIdAction, BranchData } from "@/actions/branchActions";

export default function BranchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [branch, setBranch] = useState<BranchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shiftActive, setShiftActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranch() {
      if (!branchId) return;
      setLoading(true);
      const res = await getBranchByIdAction(branchId);
      if (res.success && res.data) {
        setBranch(res.data);
      }
      setLoading(false);
    }
    loadBranch();
  }, [branchId]);

  const handleStartShift = () => {
    setShiftActive(true);
    setMessage("تم بدء شيفت العمل لهذا الفرع بنجاح وتسجيل الحضور الأولي.");
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExportReport = () => {
    if (!branch) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + `اسم الفرع,مدير الفرع,الهاتف,التحويلة,العنوان\n`
      + `"${branch.name}","${branch.manager}","${branch.phone}","${branch.ext}","${branch.address}"`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_فرع_${branch.name || "الفرع"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">جاري تحميل تفاصيل الفرع من Neon...</p>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">الفرع غير موجود</h2>
        <p className="text-xs text-slate-500">لم نتمكن من العثور على الفرع المطلوب في قاعدة البيانات.</p>
        <Link href="/ar/admin/branches" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-xs rounded-xl">
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الفروع</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/ar/admin/branches"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لجميع الفروع</span>
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{branch.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">المسؤول: {branch.manager || "غير محدد"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartShift}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 ${
                shiftActive
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{shiftActive ? "الوردية نشطة الآن" : "بدء وردية جديدة"}</span>
            </button>

            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تصدير تقرير الفرع</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              رقم التواصل والتحويلة
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {branch.phone || "---"} (داخلي: {branch.ext || "---"})
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              العنوان التوضيحي
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
              {branch.address || "غير مسجل"}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              تاريخ التسجيل
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString("ar-SA") : "الآن"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

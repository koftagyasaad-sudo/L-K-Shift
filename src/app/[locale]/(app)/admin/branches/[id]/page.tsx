"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getBranchByIdAction, updateBranchAction } from "@/actions/branchActions";
import { ArrowRight, MapPin, Building2, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function AdminBranchDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const branchId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branch, setBranch] = useState<any>(null);

  // Toast Banner State
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [mapLink, setMapLink] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const bRes = await getBranchByIdAction(branchId);

        if (bRes) {
          const branchObj = (bRes as any).data || bRes;
          setBranch(branchObj);
          setNameAr(branchObj.nameAr || branchObj.name || "");
          setNameEn(branchObj.nameEn || "");
          setAddress(branchObj.address || "");
          setLatitude(branchObj.latitude || "30.0444");
          setLongitude(branchObj.longitude || "31.2357");
          setRadiusMeters(branchObj.geofenceRadius || branchObj.radiusMeters || 100);
          setIsActive(branchObj.isActive ?? true);
        } else {
          showToast("لم يتم العثور على الفرع المطلوب", "error");
        }
      } catch (err) {
        console.error("Error loading branch detail:", err);
        showToast("حدث خطأ أثناء تحميل بيانات الفرع", "error");
      } finally {
        setLoading(false);
      }
    }

    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const handleMapLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapLink(url);

    const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const placeRegex = /search\/(-?\d+\.\d+),(-?\d+\.\d+)/;

    const match = url.match(atRegex) || url.match(qRegex) || url.match(placeRegex);
    if (match) {
      setLatitude(match[1]);
      setLongitude(match[2]);
      showToast("تم استخراج الإحداثيات بنجاح!", "success");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        id: branchId,
        nameAr,
        nameEn,
        address,
        latitude,
        longitude,
        radiusMeters: Number(radiusMeters),
        geofenceRadius: Number(radiusMeters),
        isActive,
      };

      const res = await updateBranchAction(branchId, payload);
      if (res && (res.success || !res.error)) {
        showToast("تم تعديل بيانات الفرع بنجاح", "success");
        setTimeout(() => {
          router.push("/admin/branches");
          router.refresh();
        }, 1000);
      } else {
        showToast(res?.error || "حدث خطأ أثناء الحفظ", "error");
      }
    } catch (err) {
      showToast("حدث خطأ غير متوقع", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 font-medium">جاري تحميل بيانات الفرع...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium text-sm">{feedback.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-blue-500" />
              تفاصيل الفرع: {branch?.nameAr || branch?.nameEn || "تعديل الفرع"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              تعديل بيانات الفرع والموقع الجغرافي لبصمة الحضور والانصراف
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">الاسم بالعربية *</label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">الاسم بالإنجليزية</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">العنوان</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2 bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
          <label className="text-sm font-medium text-blue-300 flex items-center gap-2">
            <MapPin size={16} />
            رابط خرائط جوجل (سحب الإحداثيات تلقائياً)
          </label>
          <input
            type="text"
            value={mapLink}
            onChange={handleMapLinkChange}
            className="w-full bg-slate-800/80 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder:text-slate-500"
            dir="ltr"
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">خط العرض (Latitude)</label>
            <input
              type="text"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">خط الطول (Longitude)</label>
            <input
              type="text"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">نطاق البصمة (بالمتر)</label>
            <input
              type="number"
              required
              min="10"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <input
            type="checkbox"
            id="isActiveBranchDetailAdmin"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="isActiveBranchDetailAdmin" className="text-sm font-medium text-slate-300 cursor-pointer">
            الفرع نشط ومتاح للبصمة
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}

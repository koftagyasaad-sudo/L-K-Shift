"use client";

import React, { useState } from "react";
import { Plus, Edit, Trash2, MapPin, Building2, CheckCircle, XCircle, X } from "lucide-react";
import { saveBranchAction, deleteBranchAction, toggleBranchStatusAction } from "@/actions/branchActions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Branch {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  geofenceRadius?: number | null;
  radiusMeters?: number | null;
  isActive?: boolean | null;
}

interface Props {
  initialBranches?: Branch[];
}

export function BranchEmployeeManager({ initialBranches = [] }: Props) {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [mapLink, setMapLink] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    nameAr: "",
    nameEn: "",
    address: "",
    latitude: "30.0444",
    longitude: "31.2357",
    radiusMeters: 100,
    isActive: true,
  });

  const openAddModal = () => {
    setEditingBranch(null);
    setMapLink("");
    setFormData({
      id: "",
      nameAr: "",
      nameEn: "",
      address: "",
      latitude: "30.0444",
      longitude: "31.2357",
      radiusMeters: 100,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setMapLink("");
    setFormData({
      id: branch.id,
      nameAr: branch.nameAr || "",
      nameEn: branch.nameEn || "",
      address: branch.address || "",
      latitude: branch.latitude || "30.0444",
      longitude: branch.longitude || "31.2357",
      radiusMeters: branch.geofenceRadius || branch.radiusMeters || 100,
      isActive: branch.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // استخراج خطوط الطول والعرض تلقائياً من رابط جوجل ماب
  const handleMapLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapLink(url);

    const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const placeRegex = /search\/(-?\d+\.\d+),(-?\d+\.\d+)/;

    const match = url.match(atRegex) || url.match(qRegex) || url.match(placeRegex);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        latitude: match[1],
        longitude: match[2],
      }));
      toast.success("تم استخراج الإحداثيات من جوجل ماب بنجاح!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await saveBranchAction(formData);
      if (res.success) {
        toast.success(formData.id ? "تم تعديل الفرع بنجاح" : "تم إضافة الفرع بنجاح");
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من حذف هذا الفرع؟")) return;
    try {
      const res = await deleteBranchAction(id);
      if (res.success) {
        toast.success("تم حذف الفرع");
        setBranches((prev) => prev.filter((b) => b.id !== id));
        router.refresh();
      } else {
        toast.error(res.error || "فشل الحذف");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus?: boolean) => {
    try {
      const res = await toggleBranchStatusAction(id, currentStatus);
      if (res.success) {
        toast.success("تم تغيير حالة الفرع");
        setBranches((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
        );
        router.refresh();
      }
    } catch (err) {
      toast.error("فشل تغيير الحالة");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-blue-500" />
            إدارة الفروع والفروض الجغرافية
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            إضافة وتعديل الفروع وتحديد نطاق بصمة الحضور والانصراف (GPS Geofence)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          إضافة فرع جديد
        </button>
      </div>

      {/* Branches Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all space-y-4 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {branch.nameAr || branch.nameEn || "فرع بدون اسم"}
                </h3>
                {branch.nameEn && (
                  <p className="text-xs text-slate-400">{branch.nameEn}</p>
                )}
              </div>
              <button
                onClick={() => handleToggleStatus(branch.id, branch.isActive ?? true)}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  branch.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {branch.isActive ? (
                  <>
                    <CheckCircle size={12} /> نشط
                  </>
                ) : (
                  <>
                    <XCircle size={12} /> غير نشط
                  </>
                )}
              </button>
            </div>

            <div className="text-sm text-slate-300 space-y-2 bg-slate-800/50 p-3 rounded-xl">
              <p className="flex items-center gap-2 text-slate-400">
                <MapPin size={14} className="text-blue-400" />
                {branch.address || "لا يوجد عنوان محدد"}
              </p>
              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                <span>الإحداثيات: {branch.latitude}, {branch.longitude}</span>
                <span className="text-blue-400 font-medium">
                  نطاق البصمة: {branch.geofenceRadius || branch.radiusMeters || 100} متر
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => openEditModal(branch)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="تعديل"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(branch.id)}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
              <h2 className="text-2xl font-bold text-white">
                {editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الاسم بالعربية *</label>
                  <input
                    type="text"
                    name="nameAr"
                    required
                    value={formData.nameAr}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="الاسد"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Lion"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">العنوان</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="دسوق - ش الجيش"
                />
              </div>

              {/* Google Maps Link Parsing Field */}
              <div className="space-y-2 bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                <label className="text-sm font-medium text-blue-300 flex items-center gap-2">
                  <MapPin size={16} />
                  رابط جوجل ماب (يقوم باستخراج الإحداثيات تلقائياً)
                </label>
                <input
                  type="text"
                  value={mapLink}
                  onChange={handleMapLinkChange}
                  className="w-full bg-slate-800/80 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder:text-slate-500"
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-slate-400">
                  انسخ رابط الموقع من تطبيق Google Maps واجعل الخانة هنا تقرأ الإحداثيات مباشرة.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">خط العرض (Latitude)</label>
                  <input
                    type="text"
                    name="latitude"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">خط الطول (Longitude)</label>
                  <input
                    type="text"
                    name="longitude"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">نصف قطر نطاق البصمة (بالمتر)</label>
                  <input
                    type="number"
                    name="radiusMeters"
                    required
                    min="10"
                    value={formData.radiusMeters}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActiveBranch"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isActiveBranch" className="text-sm font-medium text-slate-300 cursor-pointer">
                  الفرع نشط ومتاح للبصمة
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchEmployeeManager;

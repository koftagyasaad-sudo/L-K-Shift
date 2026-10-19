"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getBranchesAction, saveBranchAction, deleteBranchAction } from "@/actions/branchActions";
import type { BranchData } from "@/types";
import { Building2, Plus, Trash2, Edit, Eye, MapPin, Phone, User, Search, Loader2, X, Map } from "lucide-react";

export default function AdminBranchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isRtl = locale === "ar";

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<BranchData>({
    name: "", location: "", manager: "", phone: "", ext: "", address: "", radius_meters: 100,
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranchesAction();
      if (res.success) setBranches(res.branches || res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleOpenModal = (branch?: BranchData) => {
    if (branch) setFormData(branch);
    else setFormData({ name: "", location: "", manager: "", phone: "", ext: "", address: "", radius_meters: 100 });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFormError(isRtl ? "اسم الفرع مطلوب" : "Branch name required");
    setSubmitting(true); setFormError("");
    try {
      const res = await saveBranchAction(formData);
      if (res.success) { setIsModalOpen(false); fetchBranches(); }
      else setFormError(res.error || "خطأ");
    } catch (err: any) { setFormError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm(isRtl ? "تأكيد الحذف؟" : "Confirm delete?")) return;
    const res = await deleteBranchAction(id);
    if (res.success) fetchBranches(); else alert(res.error);
  };

  const filteredBranches = branches.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl"><Building2 className="w-7 h-7" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{isRtl ? "إدارة الفروع" : "Branches"}</h1>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md">
          <Plus className="w-5 h-5" /> {isRtl ? "إضافة فرع" : "Add Branch"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-full">{branch.radius_meters}m</span>
              <div className="flex gap-1 text-gray-400">
                <button onClick={() => handleOpenModal(branch)} className="p-2 hover:text-orange-500"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(branch.id)} className="p-2 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{branch.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{branch.location || (isRtl ? "غير محدد" : "Not specified")}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{formData.id ? (isRtl ? "تعديل" : "Edit") : (isRtl ? "إضافة" : "Add")}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{isRtl ? "اسم الفرع *" : "Name *"}</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{isRtl ? "نطاق GPS (متر)" : "GPS Radius"}</label>
                  <input type="number" value={formData.radius_meters || 100} onChange={(e) => setFormData({ ...formData, radius_meters: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{isRtl ? "رابط خرائط جوجل" : "Maps URL"}</label>
                  <input type="text" placeholder="https://maps.google.com/..." value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white" />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-bold mt-4">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isRtl ? "حفظ البيانات" : "Save")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

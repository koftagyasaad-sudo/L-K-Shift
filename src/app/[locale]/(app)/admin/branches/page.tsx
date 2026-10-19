"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  getBranchesAction,
  saveBranchAction,
  deleteBranchAction,
  BranchData,
} from "@/actions/branchActions";

export default function BranchesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<BranchData>({
    id: "",
    name: "",
    manager: "",
    phone: "",
    ext: "",
    address: "",
    location: "",
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await getBranchesAction();
      if (res.success) {
        setBranches(res.branches || res.data || []);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (branch?: BranchData) => {
    setMessage(null);
    if (branch) {
      setFormData({
        id: branch.id || "",
        name: branch.name || "",
        manager: branch.manager || "",
        phone: branch.phone || "",
        ext: branch.ext || "",
        address: branch.address || branch.location || "",
        location: branch.location || "",
      });
    } else {
      setFormData({
        id: "",
        name: "",
        manager: "",
        phone: "",
        ext: "",
        address: "",
        location: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await saveBranchAction({
        id: formData.id || undefined,
        name: formData.name.trim(),
        location: formData.address || formData.location || undefined,
        manager: formData.manager,
        phone: formData.phone,
        ext: formData.ext,
        address: formData.address,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: isAr ? "تم حفظ بيانات الفرع بنجاح!" : "Branch saved successfully!",
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchBranches();
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: res.error || (isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save branch"),
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: isAr ? "خطأ في الاتصال بالخادم" : "Server error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا الفرع؟" : "Are you sure you want to delete this branch?")) {
      return;
    }

    try {
      const res = await deleteBranchAction(id);
      if (res.success) {
        fetchBranches();
      } else {
        alert(res.error || (isAr ? "فشل حذف الفرع" : "Failed to delete branch"));
      }
    } catch (err) {
      console.error("Error deleting branch:", err);
    }
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl border border-orange-200/80 dark:border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-white dark:to-zinc-900 backdrop-blur-xl p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? "إدارة الفروع والمواقع" : "Branches & Locations Management"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isAr ? "إضافة وتعديل فروع الشركة ومتابعة حضور الموظفين بها" : "Add, update branches and manage employee attendance boundaries"}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "إضافة فرع جديد" : "Add New Branch"}</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "البحث باسم الفرع أو العنوان..." : "Search by branch name or address..."}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-xs font-medium">{isAr ? "جاري تحميل الفروع..." : "Loading branches..."}</span>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-12 text-center text-zinc-400">
          <Building2 className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-semibold">{isAr ? "لا توجد فروع مسجلة حالياً" : "No branches registered yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 shadow-lg shadow-orange-500/5 hover:border-orange-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/20">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{branch.name}</h3>
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                        {isAr ? "فرع معتمد" : "Active Branch"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                      title={isAr ? "تعديل" : "Edit"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => branch.id && handleDelete(branch.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition"
                      title={isAr ? "حذف" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {branch.manager && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span>{branch.manager}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span dir="ltr">{branch.phone}</span>
                      {branch.ext && <span className="text-[10px] text-zinc-400">({isAr ? "تحويلة" : "Ext"}: {branch.ext})</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{branch.location || branch.address || (isAr ? "العنوان غير محدد" : "Address not specified")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                <button
                  onClick={() => router.push(`/${locale}/admin/branches/${branch.id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <span>{isAr ? "عرض تفاصيل الفرع والورديات" : "View Branch Details"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                <span>{formData.id ? (isAr ? "تعديل بيانات الفرع" : "Edit Branch") : (isAr ? "إضافة فرع جديد" : "Add Branch")}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? "اسم الفرع" : "Branch Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isAr ? "مثال: الفرع الرئيسي - الرياض" : "e.g., Main Branch"}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? "مدير الفرع" : "Branch Manager"}
                  </label>
                  <input
                    type="text"
                    value={formData.manager || ""}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    placeholder={isAr ? "اسم مدير الفرع" : "Manager Name"}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0123456789"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? "العنوان أو الموقع الجغرافي" : "Address / Location"}
                </label>
                <input
                  type="text"
                  value={formData.address || formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value, location: e.target.value })}
                  placeholder={isAr ? "شارع الملك فهد، الرياض" : "King Fahd Road, Riyadh"}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? "حفظ الفرع" : "Save Branch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

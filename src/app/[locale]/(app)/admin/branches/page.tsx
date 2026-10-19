"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Building2, Plus, Search, MapPin, Phone, PhoneForwarded, 
  ExternalLink, Edit, Trash2, CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";
import { 
  getBranchesAction, 
  saveBranchAction, 
  deleteBranchAction, 
  BranchData 
} from "@/actions/branchActions";

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [formData, setFormData] = useState<BranchData>({
    id: "",
    name: "",
    manager: "",
    phone: "",
    ext: "",
    address: "",
    map_url: ""
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await getBranchesAction();
      if (res.success && res.data) {
        setBranches(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (branch?: BranchData) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({
        id: "b-" + Date.now(),
        name: "",
        manager: "",
        phone: "",
        ext: "",
        address: "",
        map_url: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "يرجى إدخال اسم الفرع" });
      return;
    }

    startTransition(async () => {
      const res = await saveBranchAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "تم حفظ بيانات الفرع بنجاح" });
        setIsModalOpen(false);
        fetchBranches();
      } else {
        setMessage({ type: "error", text: res.error || "حدث خطأ أثناء الحفظ" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا الفرع؟")) return;

    startTransition(async () => {
      const res = await deleteBranchAction(id);
      if (res.success) {
        setMessage({ type: "success", text: "تم حذف الفرع بنجاح" });
        fetchBranches();
      } else {
        setMessage({ type: "error", text: res.error || "فشل عملية الحذف" });
      }
    });
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.manager.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">إدارة الفروع</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">متابعة الفروع وتحديد مواقعها ومسؤولي الإدارة</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl text-sm shadow-md transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === "success" 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="relative">
        <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث عن اسم الفرع أو مدير الفرع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-11 pl-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">جاري تحميل بيانات الفروع من نيون...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">لا توجد فروع مسجلة</p>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة فرع جديد" لإدراج فرع في النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{branch.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">مدير الفرع: {branch.manager || "غير محدد"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                      title="تعديل الفرع"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                      title="حذف الفرع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      الهاتف:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{branch.phone || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <PhoneForwarded className="w-3.5 h-3.5 text-slate-400" />
                      التحويلة:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{branch.ext || "---"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{branch.address || "العنوان غير محدد"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                {branch.map_url ? (
                  <a
                    href={branch.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>خريطة جوجل</span>
                  </a>
                ) : <div />}

                <Link
                  href={`/ar/admin/branches/${branch.id}`}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-orange-500 hover:text-white dark:bg-slate-800 dark:hover:bg-orange-500 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                >
                  تفاصيل الفرع والشيفتات ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">اسم الفرع *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: فرع الرياض - العليا"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">مدير الفرع</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="اسم مدير الفرع"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966500000000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">التحويلة Ext</label>
                  <input
                    type="text"
                    value={formData.ext}
                    onChange={(e) => setFormData({ ...formData, ext: e.target.value })}
                    placeholder="101"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">العنوان التفصيلي</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="الشارع، الحي، المدينة"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">رابط خرائط جوجل</label>
                <input
                  type="text"
                  value={formData.map_url}
                  onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                disabled={isPending}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-xs shadow-md"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حفظ البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

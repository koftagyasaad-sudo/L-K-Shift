"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  getBranchesAction,
  saveBranchAction,
  deleteBranchAction,
} from "@/actions/branchActions";
import type { BranchData } from "@/types";
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Phone,
  User,
  Search,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";

export default function AdminBranchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isRtl = locale === "ar";

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<BranchData>({
    name: "",
    location: "",
    manager: "",
    phone: "",
    ext: "",
    address: "",
    radius_meters: 100,
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
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
    if (branch) {
      setFormData(branch);
    } else {
      setFormData({
        name: "",
        location: "",
        manager: "",
        phone: "",
        ext: "",
        address: "",
        radius_meters: 100,
      });
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(isRtl ? "اسم الفرع مطلوب" : "Branch name is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await saveBranchAction(formData);
      if (res.success) {
        handleCloseModal();
        fetchBranches();
      } else {
        setFormError(res.error || "حدث خطأ أثناء حفظ الفرع");
      }
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (
      !confirm(
        isRtl
          ? "هل أنت تأكد من رغبتك في حذف هذا الفرع؟"
          : "Are you sure you want to delete this branch?"
      )
    ) {
      return;
    }

    try {
      const res = await deleteBranchAction(id);
      if (res.success) {
        fetchBranches();
      } else {
        alert(res.error || "فشل حذف الفرع");
      }
    } catch (err: any) {
      alert(err.message || "خطأ أثناء الحذف");
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.manager && b.manager.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900">
              {isRtl ? "إدارة الفروع" : "Branch Management"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isRtl ? "إضافة وتعديل فروع الشركة ونطاق الحضور الجغرافي" : "Manage company branches and geolocation limits"}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md hover:opacity-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? "إضافة فرع جديد" : "Add New Branch"}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute top-3.5 right-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={isRtl ? "بحث باسم الفرع، الموقع، أو المدير..." : "Search by branch name, location, or manager..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Branch Cards / Table Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-gray-200">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-bold text-gray-700">{isRtl ? "لا توجد فروع مسجلة" : "No branches found"}</h3>
          <p className="text-xs text-gray-400 mt-1">{isRtl ? "قم بإنشاء فرع جديد للبدء" : "Create a new branch to get started"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                    {branch.radius_meters || 100}m radius
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/${locale}/admin/branches/${branch.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title={isRtl ? "عرض التفاصيل" : "View Details"}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                      title={isRtl ? "تعديل" : "Edit"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title={isRtl ? "حذف" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">{branch.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {branch.location || (isRtl ? "غير محدد" : "Not specified")}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {isRtl ? "المدير:" : "Manager:"}
                    </span>
                    <span className="font-semibold text-gray-800">{branch.manager || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {isRtl ? "الهاتف:" : "Phone:"}
                    </span>
                    <span className="font-semibold text-gray-800" dir="ltr">
                      {branch.phone || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {formData.id
                  ? isRtl
                    ? "تعديل بيانات الفرع"
                    : "Edit Branch"
                  : isRtl
                  ? "إضافة فرع جديد"
                  : "Add New Branch"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isRtl ? "اسم الفرع *" : "Branch Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "الموقع الجغرافي" : "Location"}
                  </label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "مدير الفرع" : "Manager"}
                  </label>
                  <input
                    type="text"
                    value={formData.manager || ""}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "نطاق الحضور (بالمتر)" : "GPS Radius (meters)"}
                  </label>
                  <input
                    type="number"
                    value={formData.radius_meters || 100}
                    onChange={(e) =>
                      setFormData({ ...formData, radius_meters: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isRtl ? "حفظ البيانات" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

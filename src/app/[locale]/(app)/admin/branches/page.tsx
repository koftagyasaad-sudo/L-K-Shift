"use client";

import { use, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getBranchesAction,
  saveBranchAction,
  deleteBranchAction,
  toggleBranchStatusAction,
  type BranchData,
} from "@/actions/branchActions";

interface BranchesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface BranchFormState {
  id?: string;
  nameAr: string;
  nameEn: string;
  address: string;
  latitude: string;
  longitude: string;
  radiusMeters: number;
  geofenceRadius: number;
  qrSecretKey: string;
  isActive: boolean;
}

const INITIAL_FORM_STATE: BranchFormState = {
  nameAr: "",
  nameEn: "",
  address: "",
  latitude: "30.0444",
  longitude: "31.2357",
  radiusMeters: 100,
  geofenceRadius: 100,
  qrSecretKey: "",
  isActive: true,
};

export default function BranchesPage({ params }: BranchesPageProps) {
  const { locale } = use(params);
  const isAr = locale !== "en";

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingRole] = useState<BranchFormState | null>(null);
  const [formData, setFormData] = useState<BranchFormState>(INITIAL_FORM_STATE);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const res = await getBranchesAction();
      if (res.success && Array.isArray(res.data)) {
        setBranches(res.data as BranchData[]);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
      toast.error(isAr ? "حدث خطأ أثناء تحميل الفروع" : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      qrSecretKey: `BRANCH-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: BranchData) => {
    const state: BranchFormState = {
      id: branch.id,
      nameAr: String(branch.nameAr || branch.name || ""),
      nameEn: String(branch.nameEn || branch.name || ""),
      address: String(branch.address || ""),
      latitude: String(branch.latitude || "30.0444"),
      longitude: String(branch.longitude || "31.2357"),
      radiusMeters: Number(branch.radiusMeters || branch.geofenceRadius || 100),
      geofenceRadius: Number(branch.geofenceRadius || branch.radiusMeters || 100),
      qrSecretKey: String(branch.qrSecretKey || `BRANCH-${Date.now()}`),
      isActive: Boolean(branch.isActive ?? true),
    };
    setEditingRole(state);
    setFormData(state);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim()) {
      toast.error(isAr ? "اسم الفرع بالعربية مطلوب" : "Arabic branch name is required");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          id: formData.id,
          nameAr: formData.nameAr.trim(),
          nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
          address: formData.address.trim() || undefined,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radiusMeters: Number(formData.radiusMeters),
          geofenceRadius: Number(formData.geofenceRadius),
          qrSecretKey: formData.qrSecretKey || `BRANCH-${Date.now()}`,
          isActive: formData.isActive,
        };

        const result = await saveBranchAction(payload);
        if (result.success) {
          toast.success(
            editingBranch
              ? isAr ? "تم تحديث الفرع بنجاح" : "Branch updated successfully"
              : isAr ? "تم إضافة الفرع بنجاح" : "Branch created successfully"
          );
          setIsModalOpen(false);
          loadBranches();
        } else {
          toast.error(result.error || (isAr ? "فشل حفظ البيانات" : "Failed to save branch"));
        }
      } catch (err) {
        toast.error(isAr ? "حدث خطأ غير متوقع" : "Unexpected error occurred");
      }
    });
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا الفرع؟" : "Are you sure you want to delete this branch?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteBranchAction(id);
        if (res.success) {
          toast.success(isAr ? "تم حذف الفرع بنجاح" : "Branch deleted successfully");
          loadBranches();
        } else {
          toast.error(res.error || (isAr ? "فشل حذف الفرع" : "Failed to delete branch"));
        }
      } catch (err) {
        toast.error(isAr ? "حدث خطأ أثناء الحذف" : "Error deleting branch");
      }
    });
  };

  const handleToggleStatus = (id?: string, currentStatus?: boolean | null) => {
    if (!id) return;
    startTransition(async () => {
      try {
        const res = await toggleBranchStatusAction(id, Boolean(currentStatus));
        if (res.success) {
          toast.success(isAr ? "تم تغيير حالة الفرع" : "Branch status updated");
          loadBranches();
        } else {
          toast.error(res.error || (isAr ? "فشل تحديث الحالة" : "Failed to update status"));
        }
      } catch (err) {
        toast.error(isAr ? "حدث خطأ غير متوقع" : "Error toggling status");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? "إدارة الفروع والمواقع الجغرافية" : "Manage Branches & Geofencing"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAr
              ? "تعيين الفروع وإحداثيات الـ GPS ونصف قطر النطاق المسموح لبصمة الحضور"
              : "Set up branches, GPS coordinates, and geofence radiuses for attendance terminal"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 shadow-sm"
        >
          {isAr ? "+ إضافة فرع جديد" : "+ Add New Branch"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base text-slate-600">
            {isAr ? "لا توجد فروع مسجلة حتى الآن." : "No branches registered yet."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 rounded-xl border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
          >
            {isAr ? "إضافة فرع الآن" : "Add Branch Now"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const branchName = isAr
              ? String(branch.nameAr || branch.name || branch.nameEn || "")
              : String(branch.nameEn || branch.name || branch.nameAr || "");

            return (
              <div
                key={branch.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{branchName}</h2>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(branch.id, branch.isActive)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        branch.isActive ?? true
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {branch.isActive ?? true
                        ? isAr ? "نشط" : "Active"
                        : isAr ? "معطل" : "Inactive"}
                    </button>
                  </div>

                  {branch.address ? (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      📍 {String(branch.address)}
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">
                        {isAr ? "الإحداثيات (GPS):" : "Coordinates:"}
                      </span>
                      <span className="font-mono dir-ltr">
                        {String(branch.latitude || "0")}, {String(branch.longitude || "0")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">
                        {isAr ? "نصف قطر النطاق:" : "Geofence Radius:"}
                      </span>
                      <span className="font-semibold text-sky-700">
                        {Number(branch.geofenceRadius || branch.radiusMeters || 100)}{" "}
                        {isAr ? "متر" : "meters"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(branch)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    disabled={isPending}
                  >
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(branch.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
                    disabled={isPending}
                  >
                    {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" dir={isAr ? "rtl" : "ltr"}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingBranch
                  ? isAr ? "تعديل بيانات الفرع" : "Edit Branch"
                  : isAr ? "إضافة فرع جديد" : "Add New Branch"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isAr ? "الاسم بالعربية" : "Name (Arabic)"} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder={isAr ? "مثال: فرع القاهرة" : "e.g. Cairo Branch"}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isAr ? "الاسم بالإنجليزية" : "Name (English)"}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Cairo Branch"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isAr ? "العنوان" : "Address"}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={isAr ? "العنوان التفصيلي للفرع..." : "Detailed branch address..."}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isAr ? "خط العرض (Latitude)" : "Latitude"}
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="30.0444"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dir-ltr"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isAr ? "خط الطول (Longitude)" : "Longitude"}
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="31.2357"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dir-ltr"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isAr ? "نصف قطر نطاق البصمة (بالمتر)" : "Geofence Radius (Meters)"}
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={formData.geofenceRadius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      geofenceRadius: Number(e.target.value),
                      radiusMeters: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  {isAr ? "الفرع نشط ومتاح للبصمة" : "Branch is Active for Attendance"}
                </span>
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={isPending}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending
                    ? isAr ? "جاري الحفظ..." : "Saving..."
                    : isAr ? "حفظ" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

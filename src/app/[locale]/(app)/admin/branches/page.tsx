"use client";

import { useEffect, useState, use } from "react";
import {
  getBranchesAction,
  saveBranchAction,
  deleteBranchAction,
  toggleBranchStatusAction,
  BranchData,
} from "@/actions/branchActions";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Edit,
  Trash2,
  Power,
  Loader2,
  ExternalLink,
  X,
  Save,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminBranchesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { locale } = resolvedParams;

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BranchData>({
    nameAr: "",
    nameEn: "",
    address: "",
    latitude: "24.7136",
    longitude: "46.6753",
    geofenceRadius: 100,
    isActive: true,
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranchesAction();
      if (res.success && Array.isArray(res.data)) {
        setBranches(res.data);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
      toast.error("حدث خطأ أثناء تحميل قائمة الفروع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setFormData({
      nameAr: "",
      nameEn: "",
      address: "",
      latitude: "24.7136",
      longitude: "46.6753",
      geofenceRadius: 100,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      id: branch.id,
      nameAr: branch.nameAr || "",
      nameEn: branch.nameEn || "",
      address: branch.address || "",
      latitude: branch.latitude || "24.7136",
      longitude: branch.longitude || "46.6753",
      geofenceRadius: branch.geofenceRadius || branch.radiusMeters || 100,
      isActive: branch.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr && !formData.nameEn) {
      toast.error("يرجى إدخال اسم الفرع");
      return;
    }

    setSaving(true);
    try {
      const res = await saveBranchAction(formData);
      if (res.success) {
        toast.success(
          editingBranch ? "تم تحديث بيانات الفرع بنجاح" : "تم إضافة الفرع بنجاح"
        );
        setIsModalOpen(false);
        loadBranches();
      } else {
        toast.error(res.error || "فشل حفظ بيانات الفرع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branch: any) => {
    try {
      const newStatus = !branch.isActive;
      const res = await toggleBranchStatusAction(branch.id, newStatus);
      if (res.success) {
        toast.success(newStatus ? "تم تفعيل الفرع" : "تم تعطيل الفرع");
        setBranches((prev) =>
          prev.map((b) => (b.id === branch.id ? { ...b, isActive: newStatus } : b))
        );
      } else {
        toast.error(res.error || "فشل تغيير حالة الفرع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تغيير الحالة");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا الفرع؟")) return;

    try {
      const res = await deleteBranchAction(id);
      if (res.success) {
        toast.success("تم حذف الفرع بنجاح");
        setBranches((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast.error(res.error || "تعذر حذف الفرع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء عملية الحذف");
    }
  };

  const isRtl = locale === "ar";
  const filteredBranches = branches.filter((b) => {
    const q = searchQuery.toLowerCase();
    const nameAr = (b.nameAr || "").toLowerCase();
    const nameEn = (b.nameEn || "").toLowerCase();
    const address = (b.address || "").toLowerCase();
    return nameAr.includes(q) || nameEn.includes(q) || address.includes(q);
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            إدارة الفروع
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إضافة وتعديل الفروع وتحديد النطاقات الجغرافية لتسجيل الحضور
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4 me-2" />
          إضافة فرع جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="البحث باسم الفرع أو العنوان..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 ps-9 pe-4 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="p-8 text-center rounded-xl border bg-card text-muted-foreground space-y-3">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-base font-medium">لا يوجد فروع مضافة حالياً</p>
          <p className="text-sm text-muted-foreground">
            قم بالضغط على "إضافة فرع جديد" لإضافة أول فرع في النظام.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {isRtl ? branch.nameAr : branch.nameEn || branch.nameAr}
                    </h3>
                    {branch.nameEn && isRtl && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {branch.nameEn}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.isActive
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {branch.isActive ? "نشط" : "غير نشط"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">
                      {branch.address || "عنوان الفرع غير محدد"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>نصف قطر النطاق:</span>
                    <span className="font-semibold text-foreground">
                      {branch.geofenceRadius || branch.radiusMeters || 100} متر
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span>الإحداثيات:</span>
                    <span className="font-mono text-foreground">
                      {branch.latitude?.slice(0, 7)}, {branch.longitude?.slice(0, 7)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-3 gap-1">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/${locale}/admin/branches/${branch.id}`}
                    className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => handleOpenEditModal(branch)}
                    className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(branch)}
                    className={`p-2 rounded-md transition-colors ${
                      branch.isActive
                        ? "hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        : "hover:bg-green-50 text-muted-foreground hover:text-green-600"
                    }`}
                    title={branch.isActive ? "تعطيل" : "تفعيل"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(branch.id)}
                  className="p-2 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">
                {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    placeholder="فرع الرياض"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    الاسم بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    placeholder="Riyadh Branch"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="طريق الملك فهد، العليا، الرياض"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    خط العرض (Latitude) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="24.7136"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    خط الطول (Longitude) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="46.6753"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  نصف قطر النطاق الجغرافي (بالمتر) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="5000"
                  value={formData.geofenceRadius || 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      geofenceRadius: parseInt(e.target.value) || 100,
                      radiusMeters: parseInt(e.target.value) || 100,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <span className="text-xs font-semibold">تفعيل الفرع</span>
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-input text-xs font-medium hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      حفظ الفرع
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  saveRoleAction,
  deleteRoleAction,
  toggleRoleStatusAction,
  type RoleData,
} from "@/actions/roleActions";
import { useRouter } from "next/navigation";

interface RoleManagerProps {
  initialRoles?: RoleData[];
}

const AVAILABLE_PERMISSIONS = [
  { id: "view_employees", label: "عرض الموظفين" },
  { id: "manage_employees", label: "إدارة الموظفين (إضافة/تعديل/حذف)" },
  { id: "view_branches", label: "عرض الفروع" },
  { id: "manage_branches", label: "إدارة الفروع والجغرافيا" },
  { id: "view_attendance", label: "عرض سجلات الحضور" },
  { id: "edit_attendance", label: "تعديل الحضور والتنفيذ" },
  { id: "view_reports", label: "عرض التقارير" },
];

export function RoleManager({ initialRoles = [] }: RoleManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [formData, setFormData] = useState({
    id: "",
    nameAr: "",
    nameEn: "",
    description: "",
    permissions: [] as string[],
    isActive: true,
  });

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({
      id: "",
      nameAr: "",
      nameEn: "",
      description: "",
      permissions: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleData) => {
    setEditingRole(role);
    setFormData({
      id: role.id,
      nameAr: role.nameAr || role.name || "",
      nameEn: role.nameEn || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      isActive: role.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handlePermissionChange = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      const updated = exists
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await saveRoleAction(formData);
      if (res && (res.success || !res.error)) {
        showToast(
          formData.id ? "تم تعديل الدور بنجاح" : "تم إضافة الدور بنجاح",
          "success"
        );
        setIsModalOpen(false);
        router.refresh();
      } else {
        showToast(res?.error || "حدث خطأ أثناء حفظ البيانات", "error");
      }
    } catch (err) {
      showToast("حدث خطأ غير متوقع", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من حذف هذا الدور؟")) return;
    try {
      const res = await deleteRoleAction(id);
      if (res && (res.success || !res.error)) {
        showToast("تم حذف الدور بنجاح", "success");
        setRoles((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } else {
        showToast(res?.error || "فشل الحذف", "error");
      }
    } catch (err) {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus?: boolean) => {
    try {
      const res = await toggleRoleStatusAction(id, currentStatus);
      if (res && (res.success || !res.error)) {
        showToast("تم تغيير حالة الدور بنجاح", "success");
        setRoles((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
        );
        router.refresh();
      }
    } catch (err) {
      showToast("فشل تغيير الحالة", "error");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium text-sm">{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-purple-500" />
            إدارة الأدوار والصلاحيات
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            إضافة وتعديل أدوار الموظفين وتخصيص صلاحيات الشاشات والعمليات
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-600/20"
        >
          <Plus size={18} />
          إضافة دور جديد
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all space-y-4 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {role.nameAr || role.name || role.nameEn || "دور بدون اسم"}
                </h3>
                {role.nameEn && (
                  <p className="text-xs text-slate-400">{role.nameEn}</p>
                )}
              </div>
              <button
                onClick={() =>
                  handleToggleStatus(role.id, role.isActive ?? true)
                }
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  role.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {role.isActive ? (
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

            <p className="text-sm text-slate-400 min-h-[40px]">
              {role.description || "لا يوجد وصف محدد لهذا الدور"}
            </p>

            <div className="bg-slate-800/50 p-3 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                الصلاحيات الممنوحة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                  role.permissions.map((p) => {
                    const label =
                      AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label ||
                      p;
                    return (
                      <span
                        key={p}
                        className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs px-2 py-0.5 rounded-md"
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500">
                    لا توجد صلاحيات خاصة
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => openEditModal(role)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="تعديل"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(role.id)}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
              <h2 className="text-2xl font-bold text-white">
                {editingRole ? "تعديل الدور" : "إضافة دور جديد"}
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
                  <label className="text-sm font-medium text-slate-300">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="كول سنتر"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    الاسم بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Call Center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">الوصف</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="وصف مختصر لمسؤوليات هذا الدور"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300 block">
                  الصلاحيات
                </label>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3 max-h-52 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handlePermissionChange(perm.id)}
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-200">
                          {perm.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActiveRoleModal"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="isActiveRoleModal"
                  className="text-sm font-medium text-slate-300 cursor-pointer"
                >
                  تفعيل هذا الدور
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all disabled:opacity-50"
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

export default RoleManager;

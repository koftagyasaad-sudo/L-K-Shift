"use client";

import { use, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getRolesAction,
  deleteRoleAction,
  saveRoleAction,
  type RoleData,
} from "@/actions/roleActions";
import { getBranchesAction, type BranchData } from "@/actions/branchActions";

interface RolesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface CustomRoleFormState {
  id?: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: "employees:read", labelAr: "عرض الموظفين", labelEn: "View Employees" },
  { id: "employees:write", labelAr: "إدارة الموظفين", labelEn: "Manage Employees" },
  { id: "branches:read", labelAr: "عرض الفروع", labelEn: "View Branches" },
  { id: "branches:write", labelAr: "إدارة الفروع", labelEn: "Manage Branches" },
  { id: "attendance:read", labelAr: "عرض سجلات الحضور", labelEn: "View Attendance Logs" },
  { id: "attendance:write", labelAr: "تعديل الحضور والتنفيذ", labelEn: "Manage Attendance" },
  { id: "reports:read", labelAr: "عرض التقارير", labelEn: "View Reports" },
];

export default function RolesPage({ params }: RolesPageProps) {
  const { locale } = use(params);
  const isAr = locale !== "en";

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<CustomRoleFormState | null>(null);

  const [formData, setFormData] = useState<CustomRoleFormState>({
    name: "",
    nameAr: "",
    nameEn: "",
    description: "",
    permissions: [],
    isActive: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [roleRes, branchRes] = await Promise.all([
        getRolesAction(),
        getBranchesAction(),
      ]);

      if (roleRes.success && Array.isArray(roleRes.data)) {
        setRoles(roleRes.data as unknown as RoleData[]);
      } else {
        setRoles([]);
      }

      if (branchRes.success && Array.isArray(branchRes.data)) {
        setBranches(branchRes.data as unknown as BranchData[]);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Failed to load roles page:", err);
      toast.error(isAr ? "حدث خطأ أثناء تحميل الصلاحيات" : "Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      nameAr: "",
      nameEn: "",
      description: "",
      permissions: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleData) => {
    const rawPerms = Array.isArray(role.permissions) ? role.permissions : [];
    const formattedPerms: string[] = rawPerms.map((p) => String(p));

    setEditingRole({
      id: role.id,
      name: String(role.name || role.nameAr || role.nameEn || ""),
      nameAr: String(role.nameAr || role.name || ""),
      nameEn: String(role.nameEn || role.name || ""),
      description: role.description ? String(role.description) : "",
      permissions: formattedPerms,
      isActive: role.isActive ?? true,
    });
    setFormData({
      id: role.id,
      name: String(role.name || role.nameAr || role.nameEn || ""),
      nameAr: String(role.nameAr || role.name || ""),
      nameEn: String(role.nameEn || role.name || ""),
      description: role.description ? String(role.description) : "",
      permissions: formattedPerms,
      isActive: role.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      const exists = current.includes(permId);
      const updated = exists
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, permissions: updated };
    });
  };

  const handleSubmitRole = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToSave = formData.nameAr.trim() || formData.name.trim() || formData.nameEn.trim();

    if (!nameToSave) {
      toast.error(isAr ? "اسم الدور مطلوب" : "Role name is required");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          id: formData.id,
          name: nameToSave,
          nameAr: formData.nameAr.trim() || nameToSave,
          nameEn: formData.nameEn.trim() || nameToSave,
          description: formData.description?.trim() || undefined,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };

        const result = await saveRoleAction(payload);
        if (result.success) {
          toast.success(
            editingRole
              ? isAr ? "تم تحديث الدور بنجاح" : "Role updated successfully"
              : isAr ? "تم إضافة الدور بنجاح" : "Role added successfully"
          );
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error(result.error || (isAr ? "فشل حفظ البيانات" : "Failed to save role"));
        }
      } catch (err) {
        toast.error(isAr ? "حدث خطأ غير متوقع" : "Unexpected error occurred");
      }
    });
  };

  const handleDeleteRole = (roleId: string) => {
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا الدور؟" : "Are you sure you want to delete this role?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteRoleAction(roleId);
        if (res.success) {
          toast.success(isAr ? "تم حذف الدور بنجاح" : "Role deleted successfully");
          loadData();
        } else {
          toast.error(res.error || (isAr ? "فشل حذف الدور" : "Failed to delete role"));
        }
      } catch (err) {
        toast.error(isAr ? "حدث خطأ أثناء الحذف" : "Error deleting role");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? "إدارة الصلاحيات والأدوار المخصصة" : "Custom Roles & Permissions"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAr
              ? "إضافة وتعديل أدوار الموظفين وتحديد صلاحياتهم في النظام"
              : "Create and manage system roles and fine-grained permissions"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 shadow-sm"
        >
          {isAr ? "+ إضافة دور جديد" : "+ Add New Role"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base text-slate-600">
            {isAr ? "لا توجد أدوار مخصصة حالياً." : "No custom roles found."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 rounded-xl border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
          >
            {isAr ? "إضافة دور الآن" : "Add Role Now"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const roleName = isAr
              ? String(role.nameAr || role.name || role.nameEn || "")
              : String(role.nameEn || role.name || role.nameAr || "");
            const rawPerms = Array.isArray(role.permissions) ? role.permissions : [];

            return (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{roleName}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        role.isActive ?? true
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {role.isActive ?? true
                        ? isAr ? "نشط" : "Active"
                        : isAr ? "معطل" : "Inactive"}
                    </span>
                  </div>

                  {role.description ? (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {String(role.description)}
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-xs font-medium text-slate-700 block">
                      {isAr ? "الصلاحيات الممنوحة:" : "Permissions:"}
                    </span>
                    {rawPerms.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        {isAr ? "لا توجد صلاحيات محددة" : "No specific permissions"}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rawPerms.map((p) => (
                          <span
                            key={String(p)}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {String(p)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(role)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    disabled={isPending}
                  >
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => role.id && handleDeleteRole(role.id)}
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

      {/* Modal Dialog */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" dir={isAr ? "rtl" : "ltr"}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingRole
                  ? isAr ? "تعديل الدور" : "Edit Role"
                  : isAr ? "إضافة دور جديد" : "Add New Role"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRole} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isAr ? "الاسم بالعربية" : "Name (Arabic)"} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isAr ? "الوصف" : "Description"}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {isAr ? "الصلاحيات" : "Permissions"}
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3 bg-slate-50">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.id);
                    return (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs text-slate-800">
                          {isAr ? perm.labelAr : perm.labelEn}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  {isAr ? "تفعيل هذا الدور" : "Role is Active"}
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

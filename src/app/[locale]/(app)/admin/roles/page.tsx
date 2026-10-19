"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  Edit2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  getRolesAction,
  saveRoleAction,
  deleteRoleAction,
} from "@/actions/roleActions";
import { getBranchesAction } from "@/actions/branchActions";
import type { RoleData, BranchData } from "@/types";

const AVAILABLE_PERMISSIONS = [
  { id: "view_attendance", labelAr: "عرض سجل الحضور", labelEn: "View Attendance" },
  { id: "manage_leaves", labelAr: "إدارة طلبات الإجازات", labelEn: "Manage Leaves" },
  { id: "manage_employees", labelAr: "إدارة الموظفين والرواتب", labelEn: "Manage Employees" },
  { id: "manage_branches", labelAr: "إدارة الفروع والورديات", labelEn: "Manage Branches" },
  { id: "manage_roles", labelAr: "إدارة الأدوار والصلاحيات", labelEn: "Manage Roles" },
];

export default function RolesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isAr = locale === "ar";

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<RoleData>({
    id: "",
    name: "",
    description: "",
    permissions: [],
    branch_ids: [],
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [roleRes, branchRes] = await Promise.all([
        getRolesAction(),
        getBranchesAction(),
      ]);

      if (roleRes.success) setRoles(roleRes.roles || roleRes.data || []);
      if (branchRes.success) setBranches(branchRes.branches || branchRes.data || []);
    } catch (err) {
      console.error("Failed to load roles page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpenModal = (role?: RoleData) => {
    setMessage(null);
    if (role) {
      setFormData({
        id: role.id || "",
        name: role.name || "",
        description: role.description || "",
        permissions: role.permissions || [],
        branch_ids: role.branch_ids || [],
      });
    } else {
      setFormData({
        id: "",
        name: "",
        description: "",
        permissions: ["view_attendance"],
        branch_ids: [],
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
      const res = await saveRoleAction({
        id: formData.id || undefined,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        permissions: formData.permissions,
        branch_ids: formData.branch_ids,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: isAr ? "تم حفظ الدور المسمى الوظيفي بنجاح!" : "Role saved successfully!",
        });
        setTimeout(() => {
          setIsModalOpen(false);
          fetchAll();
        }, 900);
      } else {
        setMessage({
          type: "error",
          text: res.error || (isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save role"),
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: isAr ? "خطأ في الاتصال بالخادم" : "Server connection error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الدور؟" : "Are you sure you want to delete this role?")) {
      return;
    }

    try {
      const res = await deleteRoleAction(id);
      if (res.success) {
        fetchAll();
      } else {
        alert(res.error || (isAr ? "فشل حذف الدور" : "Failed to delete role"));
      }
    } catch (err) {
      console.error("Error deleting role:", err);
    }
  };

  const togglePermission = (permId: string) => {
    const current = formData.permissions || [];
    if (current.includes(permId)) {
      setFormData({ ...formData, permissions: current.filter((p) => p !== permId) });
    } else {
      setFormData({ ...formData, permissions: [...current, permId] });
    }
  };

  const toggleBranch = (bId: string) => {
    const current = formData.branch_ids || [];
    if (current.includes(bId)) {
      setFormData({ ...formData, branch_ids: current.filter((b) => b !== bId) });
    } else {
      setFormData({ ...formData, branch_ids: [...current, bId] });
    }
  };

  const filteredRoles = roles.filter((r) =>
    !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="rounded-3xl border border-orange-200/80 dark:border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-white dark:to-zinc-900 backdrop-blur-xl p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isAr ? "إدارة الأدوار والصلاحيات" : "Roles & Permissions"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "تخصيص المسميات الوظيفية وصلاحيات التحكم وربطها بالفروع"
              : "Define job roles, system permissions, and assigned branches"}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "إضافة دور جديد" : "Add New Role"}</span>
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "ابحث باسم المسمى الوظيفي..." : "Search role name..."}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-xs font-medium">{isAr ? "جاري تحميل الأدوار..." : "Loading roles..."}</span>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-12 text-center text-zinc-400">
          <ShieldCheck className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-semibold">{isAr ? "لا توجد أدوار مسجلة حالياً" : "No roles registered yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="rounded-3xl border border-orange-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 shadow-lg shadow-orange-500/5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{role.name}</h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{role.description || (isAr ? "لا يوجد وصف" : "No description")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(role)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                      title={isAr ? "تعديل" : "Edit"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => role.id && handleDelete(role.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition"
                      title={isAr ? "حذف" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>{formData.id ? (isAr ? "تعديل الدور" : "Edit Role") : (isAr ? "إضافة دور جديد" : "Add Role")}</span>
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
                  {isAr ? "اسم الدور / المسمى الوظيفي" : "Role Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isAr ? "مثال: مدير فرع / مشرف وردية" : "e.g., Branch Manager"}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? "الوصف" : "Description"}
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isAr ? "وصف مختصر للمسؤوليات..." : "Role responsibilities..."}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Permissions List */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  {isAr ? "الصلاحيات المتاحة" : "Permissions"}
                </label>
                <div className="space-y-1.5">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = (formData.permissions || []).includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="rounded text-orange-500 focus:ring-orange-400"
                        />
                        <span>{isAr ? perm.labelAr : perm.labelEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Branches Multi-select */}
              {branches.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    <span>{isAr ? "الفروع المخصصة لهذا الدور" : "Assigned Branches"}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                    {branches.map((b) => {
                      const isAssigned = (formData.branch_ids || []).includes(b.id || "");
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => b.id && toggleBranch(b.id)}
                          className={`p-2 rounded-xl text-xs font-medium border text-start transition ${
                            isAssigned
                              ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-xs"
                              : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  <span>{isAr ? "حفظ الدور" : "Save Role"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  ShieldCheck, Plus, Search, Edit, Trash2, Check, 
  Building2, CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";
import { getRolesAction, saveRoleAction, deleteRoleAction, RoleData } from "@/actions/roleActions";
import { getBranchesAction, BranchData } from "@/actions/branchActions";

const AVAILABLE_PERMISSIONS = [
  { id: "all", label: "صلاحيات مطلقة (SUPER_ADMIN)" },
  { id: "manage_branches", label: "إدارة الفروع وتعديلها" },
  { id: "manage_employees", label: "إدارة الموظفين والرواتب" },
  { id: "view_reports", label: "عرض وتقارير الحضور والغياب" },
  { id: "approve_leaves", label: "الموافقة على طلبات الإجازات" },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [formData, setFormData] = useState<RoleData>({
    id: "",
    title: "",
    permissions: [],
    branch_ids: []
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [rolesRes, branchesRes] = await Promise.all([
      getRolesAction(),
      getBranchesAction()
    ]);
    if (rolesRes.success) setRoles(rolesRes.data);
    if (branchesRes.success) setBranches(branchesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (role?: RoleData) => {
    if (role) {
      setEditingRole(role);
      setFormData(role);
    } else {
      setEditingRole(null);
      setFormData({
        id: "r-" + Date.now(),
        title: "",
        permissions: [],
        branch_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const toggleBranch = (branchId: string) => {
    setFormData((prev) => {
      const exists = prev.branch_ids.includes(branchId);
      return {
        ...prev,
        branch_ids: exists
          ? prev.branch_ids.filter((b) => b !== branchId)
          : [...prev.branch_ids, branchId]
      };
    });
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "يرجى كتابة المسمى الوظيفي للدور" });
      return;
    }

    startTransition(async () => {
      const res = await saveRoleAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "تم حفظ الدور والصلاحيات في نيون بنجاح" });
        setIsModalOpen(false);
        loadData();
      } else {
        setMessage({ type: "error", text: res.error || "فشل عملية الحفظ" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدور؟")) return;

    startTransition(async () => {
      const res = await deleteRoleAction(id);
      if (res.success) {
        setMessage({ type: "success", text: "تم حذف الدور الوظيفي" });
        loadData();
      } else {
        setMessage({ type: "error", text: res.error || "فشل الحذف" });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">إدارة الأدوار والصلاحيات</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">ربط الأدوار بالفروع وتخصيص صلاحيات المستخدمين</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دور وظيفي جديد</span>
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

      {/* Roles Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">جاري جلب الأدوار والصلاحيات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:border-orange-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{role.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(role)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned Branches */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">الفروع التابعة لها:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.branch_ids.length === 0 ? (
                      <span className="text-xs text-slate-400">لا توجد فروع مخصصة</span>
                    ) : (
                      role.branch_ids.map((bId) => {
                        const bName = branches.find((b) => b.id === bId)?.name || bId;
                        return (
                          <span key={bId} className="px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {bName}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Permissions Badges */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">الصلاحيات الممنوحة:</span>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p) => {
                      const label = AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label || p;
                      return (
                        <span key={p} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px]">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Modal for Add/Edit Role & Assign Branches */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {editingRole ? "تعديل الدور والصلاحيات" : "إنشاء دور وظيفي جديد"}
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">المسمى الوظيفي *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: مشرف الفرع الرئيسي"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Dynamic Multi-Select Branches */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">تخصيص الفروع التابعة للدور (Multi-Select)</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  {branches.map((b) => {
                    const selected = formData.branch_ids.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => toggleBranch(b.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-right transition-colors ${
                          selected 
                            ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5" />
                          {b.name}
                        </span>
                        {selected && <Check className="w-4 h-4 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Selection */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-2 font-semibold">قائمة الصلاحيات</label>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.id);
                    return (
                      <label key={perm.id} className="flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
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
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حفظ الصلاحيات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Shield, Trash2, X } from "lucide-react";

type PermissionItem = { id: string; label: string; labelAr: string };
type PermissionCategory = { category: string; categoryAr: string; items: readonly PermissionItem[] };

type CustomRole = {
  id: number;
  name: string;
  nameAr: string;
  permissions: string[];
  isSystem: boolean;
};

export function RoleManager({
  locale,
  roles,
  catalog,
}: {
  locale: "ar" | "en";
  roles: CustomRole[];
  catalog: readonly PermissionCategory[];
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function openCreateForm() {
    setEditingRole(null);
    setNameAr("");
    setSelectedPermissions([]);
    setShowForm(true);
  }

  function openEditForm(role: CustomRole) {
    setEditingRole(role);
    setNameAr(role.nameAr);
    setSelectedPermissions(role.permissions);
    setShowForm(true);
  }

  function togglePermission(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!nameAr.trim()) {
      toast.error(isAr ? "يرجى إدخال اسم الصلاحية" : "Please enter a role name");
      return;
    }

    setSaving(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameAr, name: nameAr, permissions: selectedPermissions }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? (isAr ? "حدث خطأ" : "Something went wrong"));
        return;
      }

      toast.success(isAr ? "تم الحفظ بنجاح" : "Saved successfully");
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: CustomRole) {
    const confirmed = window.confirm(
      isAr ? `هل تريد حذف صلاحية "${role.nameAr}"؟` : `Delete role "${role.name}"?`
    );
    if (!confirmed) return;

    const response = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? (isAr ? "تعذر الحذف" : "Could not delete"));
      return;
    }

    toast.success(isAr ? "تم الحذف بنجاح" : "Deleted successfully");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Shield className="h-5 w-5 text-accent" />
          {isAr ? "الصلاحيات المخصصة" : "Custom Roles"}
        </h2>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة صلاحية" : "Add Role"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-foreground">{isAr ? role.nameAr : role.name}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {role.permissions.length} {isAr ? "صلاحية" : "permissions"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditForm(role)}
                  className="rounded-lg p-1.5 text-foreground-muted transition hover:bg-background-secondary hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!role.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDelete(role)}
                    className="text-danger hover:bg-danger/10 rounded-lg p-1.5 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.permissions.slice(0, 4).map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-background-secondary px-2 py-0.5 text-[10px] font-medium text-foreground-muted"
                >
                  {p}
                </span>
              ))}
              {role.permissions.length > 4 && (
                <span className="rounded-full bg-background-secondary px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
                  +{role.permissions.length - 4}
                </span>
              )}
            </div>
          </div>
        ))}

        {roles.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
            {isAr ? "لا توجد صلاحيات مخصصة بعد" : "No custom roles yet"}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingRole
                  ? isAr ? "تعديل الصلاحية" : "Edit Role"
                  : isAr ? "إضافة صلاحية جديدة" : "Add New Role"}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-foreground-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground-muted">
                  {isAr ? "اسم الصلاحية" : "Role Name"}
                </label>
                <input
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={isAr ? "مثال: مشرف المخزون" : "e.g. Inventory Supervisor"}
                />
              </div>

              <div className="space-y-4">
                {catalog.map((group) => (
                  <div key={group.category}>
                    <p className="mb-2 text-xs font-bold text-foreground-muted">
                      {isAr ? group.categoryAr : group.category}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.items.map((item) => {
                        const checked = selectedPermissions.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                              checked
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-foreground-muted hover:bg-background-secondary"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(item.id)}
                              className="h-4 w-4 rounded border-border accent-accent"
                            />
                            {isAr ? item.labelAr : item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground-muted transition hover:bg-background-secondary"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isAr ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

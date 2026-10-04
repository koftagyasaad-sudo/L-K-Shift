// src/components/admin/branch-employee-manager.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type AvailableUser = {
  id: number;
  fullNameAr: string;
  fullNameEn: string | null;
};

export function BranchEmployeeManager({
  branchId,
  locale,
  availableUsers,
}: {
  branchId: number;
  locale: "ar" | "en";
  availableUsers: AvailableUser[];
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${selectedUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryBranchId: branchId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? (isAr ? "تعذر إضافة الموظف" : "Unable to assign employee"));
        return;
      }

      toast.success(isAr ? "تمت إضافة الموظف للفرع" : "Employee assigned to branch");
      setSelectedUserId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border bg-background-secondary/50 p-3">
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="min-w-[200px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      >
        <option value="">{isAr ? "اختر موظفًا لإضافته..." : "Select employee to add..."}</option>
        {availableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {isAr ? user.fullNameAr : (user.fullNameEn ?? user.fullNameAr)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAssign}
        disabled={!selectedUserId || loading}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {isAr ? "إضافة" : "Add"}
      </button>
    </div>
  );
}

export function RemoveFromBranchButton({
  employeeId,
  locale,
}: {
  employeeId: number;
  locale: "ar" | "en";
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryBranchId: null }),
      });

      if (!response.ok) {
        toast.error(isAr ? "تعذر إزالة الموظف" : "Unable to remove employee");
        return;
      }

      toast.success(isAr ? "تمت إزالة الموظف من الفرع" : "Employee removed from branch");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      title={isAr ? "إزالة من الفرع" : "Remove from branch"}
      className="text-danger hover:bg-danger/10 flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-50"
    >
      <UserMinus className="h-4 w-4" />
    </button>
  );
}

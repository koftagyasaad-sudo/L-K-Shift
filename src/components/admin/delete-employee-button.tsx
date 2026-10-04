// src/components/admin/delete-employee-button.tsx
"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

export function DeleteEmployeeButton({
  employeeId,
  locale,
}: {
  employeeId: number;
  locale: "ar" | "en";
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? (isAr ? "تعذر الحذف" : "Unable to delete"));
        return;
      }
      toast.success(isAr ? "تم تعطيل الحساب" : "Account deactivated");
      router.push("/admin/employees");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground-muted">
          {isAr ? "تأكيد الحذف؟" : "Confirm delete?"}
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isAr ? "نعم" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted"
        >
          {isAr ? "إلغاء" : "Cancel"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-danger hover:bg-danger/10 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition"
    >
      <Trash2 className="h-4 w-4" />
      {isAr ? "حذف الموظف" : "Delete Employee"}
    </button>
  );
}

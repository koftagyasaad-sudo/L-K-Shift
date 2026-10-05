"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function EmployeeDeleteButton({
  userId,
  isSelf,
  locale,
}: {
  userId: number;
  isSelf: boolean;
  locale: "ar" | "en";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAr = locale === "ar";

  if (isSelf) return null;

  async function handleDelete() {
    const confirmed = window.confirm(
      isAr ? "هل أنت متأكد من حذف هذا الموظف؟" : "Are you sure you want to delete this employee?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${userId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? (isAr ? "حدث خطأ أثناء الحذف" : "Error deleting employee"));
        return;
      }

      toast.success(isAr ? "تم حذف الموظف بنجاح" : "Employee deleted successfully");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-danger hover:bg-danger/10 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {isAr ? "حذف" : "Delete"}
    </button>
  );
}

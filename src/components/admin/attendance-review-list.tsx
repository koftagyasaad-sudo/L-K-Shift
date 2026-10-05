"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MapPin, Image as ImageIcon, Loader2 } from "lucide-react";

type PendingItem = {
  id: number;
  employeeName: string;
  employeeNameEn: string | null;
  branchNameAr: string;
  branchNameEn: string;
  workDate: string;
  checkInTime: string | null;
  checkInPhotoUrl: string | null;
  checkInApprovalStatus: string | null;
  checkInDistance: number | null;
  checkOutTime: string | null;
  checkOutPhotoUrl: string | null;
  checkOutApprovalStatus: string | null;
  checkOutDistance: number | null;
};

export function AttendanceReviewList({ locale, items }: { locale: "ar" | "en"; items: PendingItem[] }) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  async function handleDecision(logId: number, type: "checkIn" | "checkOut", decision: "APPROVED" | "REJECTED") {
    const key = `${logId}-${type}`;
    setProcessingKey(key);
    try {
      const res = await fetch(`/api/attendance/review/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? (isAr ? "حدث خطأ" : "Something went wrong"));
        return;
      }
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
      router.refresh();
    } finally {
      setProcessingKey(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border p-10 text-center text-sm text-foreground-muted">
        {isAr ? "لا توجد طلبات معلّقة للمراجعة حاليًا" : "No pending requests to review"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <p className="font-bold text-foreground">
                {isAr ? item.employeeName : (item.employeeNameEn ?? item.employeeName)}
              </p>
              <p className="text-xs text-foreground-muted">
                {isAr ? item.branchNameAr : item.branchNameEn} — {item.workDate}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {item.checkInApprovalStatus === "PENDING_REVIEW" && (
              <div className="rounded-2xl border border-amber-300/50 bg-amber-500/5 p-4">
                <p className="mb-2 text-xs font-bold text-amber-700">
                  {isAr ? "طلب تسجيل حضور" : "Check-in request"}
                </p>
                {item.checkInPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.checkInPhotoUrl} alt="check-in" className="mb-3 h-40 w-full rounded-xl object-cover" />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-background-secondary text-foreground-muted">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.checkInDistance !== null
                    ? isAr
                      ? `المسافة عن الفرع: ${item.checkInDistance} متر`
                      : `Distance from branch: ${item.checkInDistance}m`
                    : isAr
                      ? "لم يتم تحديد الموقع"
                      : "Location not available"}
                </p>
                {item.checkInTime && (
                  <p className="mt-1 text-xs text-foreground-muted">
                    {new Date(item.checkInTime).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={processingKey === `${item.id}-checkIn`}
                    onClick={() => handleDecision(item.id, "checkIn", "APPROVED")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingKey === `${item.id}-checkIn` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {isAr ? "اعتماد" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={processingKey === `${item.id}-checkIn`}
                    onClick={() => handleDecision(item.id, "checkIn", "REJECTED")}
                    className="text-danger flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:bg-danger/10 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {isAr ? "رفض" : "Reject"}
                  </button>
                </div>
              </div>
            )}

            {item.checkOutApprovalStatus === "PENDING_REVIEW" && (
              <div className="rounded-2xl border border-amber-300/50 bg-amber-500/5 p-4">
                <p className="mb-2 text-xs font-bold text-amber-700">
                  {isAr ? "طلب تسجيل انصراف" : "Check-out request"}
                </p>
                {item.checkOutPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.checkOutPhotoUrl} alt="check-out" className="mb-3 h-40 w-full rounded-xl object-cover" />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-background-secondary text-foreground-muted">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.checkOutDistance !== null
                    ? isAr
                      ? `المسافة عن الفرع: ${item.checkOutDistance} متر`
                      : `Distance from branch: ${item.checkOutDistance}m`
                    : isAr
                      ? "لم يتم تحديد الموقع"
                      : "Location not available"}
                </p>
                {item.checkOutTime && (
                  <p className="mt-1 text-xs text-foreground-muted">
                    {new Date(item.checkOutTime).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={processingKey === `${item.id}-checkOut`}
                    onClick={() => handleDecision(item.id, "checkOut", "APPROVED")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingKey === `${item.id}-checkOut` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {isAr ? "اعتماد" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={processingKey === `${item.id}-checkOut`}
                    onClick={() => handleDecision(item.id, "checkOut", "REJECTED")}
                    className="text-danger flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:bg-danger/10 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {isAr ? "رفض" : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BranchData } from "@/actions/branchActions";
import {
  deleteBranchAction,
  toggleBranchStatusAction,
} from "@/actions/branchActions";

type Props = {
  initialBranches: BranchData[];
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function getBranchDisplayName(branch: BranchData): string {
  return (
    branch.name ||
    branch.nameAr ||
    branch.nameEn ||
    "فرع بدون اسم"
  );
}

export default function BranchesClient({ initialBranches }: Props) {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchData[]>(initialBranches || []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (branches || []).filter((branch) => {
      const name = getBranchDisplayName(branch).toLowerCase();
      const address = String(branch.address || "").toLowerCase();
      const phone = String(branch.phone || "").toLowerCase();
      const manager = String(branch.managerName || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        address.includes(q) ||
        phone.includes(q) ||
        manager.includes(q);

      const isActive = branch.isActive !== false && branch.isActive !== null;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? isActive
            : !isActive;

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive !== false && b.isActive !== null).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [branches]);

  function exportCsv() {
    const header = [
      "ID",
      "الاسم",
      "الاسم بالعربي",
      "الاسم بالإنجليزي",
      "العنوان",
      "خط العرض",
      "خط الطول",
      "نصف القطر (متر)",
      "الحالة",
      "الهاتف",
      "المدير",
    ];

    const rows = filteredBranches.map((b) => [
      b.id,
      getBranchDisplayName(b),
      b.nameAr || "",
      b.nameEn || "",
      b.address || "",
      b.latitude ?? "",
      b.longitude ?? "",
      b.radiusMeters ?? b.geofenceRadius ?? 100,
      b.isActive === false ? "غير نشط" : "نشط",
      b.phone || "",
      b.managerName || "",
    ]);

    const csvContent =
      "\uFEFF" +
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const value = String(cell ?? "");
              if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `branches-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleToggleStatus(branch: BranchData) {
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        const currentStatus = branch.isActive !== false && branch.isActive !== null;
        const result: any = await toggleBranchStatusAction(branch.id, currentStatus);

        if (result && result.success === false) {
          setError(result.error || "تعذر تغيير حالة الفرع");
          return;
        }

        setBranches((prev) =>
          prev.map((b) =>
            b.id === branch.id
              ? {
                  ...b,
                  isActive: !currentStatus,
                }
              : b
          )
        );

        setMessage(
          !currentStatus
            ? `تم تفعيل الفرع: ${getBranchDisplayName(branch)}`
            : `تم إيقاف الفرع: ${getBranchDisplayName(branch)}`
        );
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "حدث خطأ أثناء تغيير الحالة");
      }
    });
  }

  function handleDelete(branch: BranchData) {
    const ok = window.confirm(
      `هل أنت متأكد من حذف الفرع "${getBranchDisplayName(branch)}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
    );
    if (!ok) return;

    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        const result: any = await deleteBranchAction(branch.id);

        if (result && result.success === false) {
          setError(result.error || "تعذر حذف الفرع");
          return;
        }

        setBranches((prev) => prev.filter((b) => b.id !== branch.id));
        setMessage(`تم حذف الفرع: ${getBranchDisplayName(branch)}`);
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "حدث خطأ أثناء حذف الفرع");
      }
    });
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الفروع</h1>
          <p className="mt-1 text-sm text-slate-500">
            عرض وإدارة فروع الشركة، المواقع، ونطاق التحقق الجغرافي للحضور
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={isPending}
          >
            تصدير CSV
          </button>

          <Link
            href="branches/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + إضافة فرع جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">إجمالي الفروع</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">فروع نشطة</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">{stats.active}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="text-sm text-rose-700">فروع متوقفة</div>
          <div className="mt-1 text-2xl font-bold text-rose-800">{stats.inactive}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم / العنوان / الهاتف / المدير..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 md:max-w-md"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">متوقف فقط</option>
          </select>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">الفرع</th>
                <th className="px-4 py-3 text-right font-semibold">العنوان</th>
                <th className="px-4 py-3 text-right font-semibold">الإحداثيات</th>
                <th className="px-4 py-3 text-right font-semibold">نطاق GPS</th>
                <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    لا توجد فروع مطابقة لخيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isActive =
                    branch.isActive !== false && branch.isActive !== null;
                  const lat = branch.latitude;
                  const lng = branch.longitude;
                  const radius = toNumber(
                    branch.radiusMeters ?? branch.geofenceRadius,
                    100
                  );

                  return (
                    <tr
                      key={branch.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {getBranchDisplayName(branch)}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {branch.nameEn || "—"}
                        </div>
                        {branch.managerName ? (
                          <div className="mt-1 text-xs text-slate-500">
                            المدير: {branch.managerName}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        <div>{branch.address || "—"}</div>
                        {branch.phone ? (
                          <div className="mt-1 text-xs text-slate-500">
                            هاتف: {branch.phone}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {lat && lng ? (
                          <div className="space-y-1">
                            <div>
                              {String(lat)}, {String(lng)}
                            </div>
                            {branch.googleMapsUrl ? (
                              <a
                                href={branch.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                فتح في Google Maps
                              </a>
                            ) : (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                فتح في Google Maps
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">غير محدد</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{radius} متر</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          }`}
                        >
                          {isActive ? "نشط" : "متوقف"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`branches/${branch.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            تعديل
                          </Link>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleStatus(branch)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                          >
                            {isActive ? "إيقاف" : "تفعيل"}
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(branch)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPending ? (
        <div className="text-sm text-slate-500">جاري تنفيذ العملية...</div>
      ) : null}
    </div>
  );
}

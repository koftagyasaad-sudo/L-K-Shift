"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

export type TableColumn<T> = {
  key: string;
  header: string | ReactNode;
  cell?: (row: T, index: number) => ReactNode;
  accessor?: (row: T) => unknown;
  sortable?: boolean;
};

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  searchableKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
  exportFileName?: string;
  pageSize?: number;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  headerExtra?: ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  data = [],
  columns = [],
  searchableKeys = [],
  searchPlaceholder,
  exportFileName = "export",
  pageSize = 10,
  emptyMessage,
  actions,
  headerExtra,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // تصفية البيانات بناءً على البحث
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchableKeys.length > 0) {
        return searchableKeys.some((key) => {
          const val = row[key as string];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
        });
      }

      return Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchableKeys]);

  // تقسيم الصفحات
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // دالة التصدير إلى Excel/CSV تدعم اللغة العربية بدعم UTF-8 BOM بدون مكتبات خارجية
  const handleExport = () => {
    try {
      if (!filteredData || filteredData.length === 0) {
        toast.error("لا توجد بيانات للتصدير");
        return;
      }

      const headers = columns.map((col) => (typeof col.header === "string" ? col.header : col.key));
      
      const rows = filteredData.map((row) => {
        return columns.map((col) => {
          if (col.accessor) {
            const val = col.accessor(row);
            return val !== null && val !== undefined ? String(val) : "";
          }
          if (col.key && row[col.key] !== undefined && row[col.key] !== null) {
            return String(row[col.key]);
          }
          return "";
        });
      });

      const csvContent =
        "\uFEFF" +
        [
          headers.join(","),
          ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error: unknown) {
      console.error("Export error:", error);
      toast.error("حدث خطأ أثناء تصدير البيانات");
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {/* شريط الأدوات والبحث */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row dark:border-white/[0.08] dark:bg-[#141519]">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder || "بحث..."}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-900 placeholder:text-slate-500 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 rtl:pr-9 ltr:pl-9 dark:border-white/[0.08] dark:bg-[#0c0d10] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {headerExtra}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-[#1c1e24]"
          >
            <Download className="h-4 w-4" />
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* الجدول */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/[0.08] dark:bg-[#141519]">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-600 rtl:text-right ltr:text-left dark:text-zinc-400">
            <thead className="border-b border-slate-200/90 bg-slate-50 text-xs uppercase text-slate-600 dark:border-white/[0.08] dark:bg-[#1c1e24] dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold">
                    {col.header}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-center font-semibold">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 2 : 1)}
                    className="px-4 py-8 text-center text-slate-500 dark:text-zinc-400"
                  >
                    {emptyMessage || "لا توجد بيانات للعرض"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                  const rowKey = typeof row.id === "string" || typeof row.id === "number" ? row.id : idx;
                  return (
                    <tr key={rowKey} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1c1e24]">
                      <td className="px-4 py-3 text-center font-mono text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                        {rowIndex}
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                          {col.cell ? col.cell(row, idx) : row[col.key] !== undefined ? String(row[col.key]) : "-"}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* عناصر التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/90 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-[#1c1e24] dark:text-zinc-400">
            <div>
              عرض {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} إلى{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} من إجمالي {filteredData.length}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#141519] dark:hover:bg-[#1c1e24]"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
              <span className="px-2 font-mono font-medium tabular-nums text-slate-900 dark:text-zinc-100">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#141519] dark:hover:bg-[#1c1e24]"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

export type TableColumn<T> = {
  key: string;
  header: string | ReactNode;
  cell?: (row: T, index: number) => ReactNode;
  accessor?: (row: T) => any;
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

export function DataTable<T extends Record<string, any>>({
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
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("حدث خطأ أثناء تصدير البيانات");
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* شريط الأدوات والبحث */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
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
            className="w-full pl-3 pr-9 rtl:pr-9 ltr:pl-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {headerExtra}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* الجدول */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right rtl:text-right ltr:text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 border-b border-gray-100">
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
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    {emptyMessage || "لا توجد بيانات للعرض"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-400 text-xs font-mono">
                        {rowIndex}
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 font-medium text-gray-800">
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
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            <div>
              عرض {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} إلى{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} من إجمالي {filteredData.length}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
              <span className="px-2 font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

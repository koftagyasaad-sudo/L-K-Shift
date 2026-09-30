"use client";

import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type TableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  className?: string;
};

type TableFilterOption = {
  label: string;
  value: string;
};

type TableFilterDefinition<T> = {
  key: string;
  label: string;
  options: TableFilterOption[];
  accessor: (row: T) => string | null | undefined;
};

export type DataTableProps<T> = {
  title?: string;
  description?: string;
  data: T[];
  columns: TableColumn<T>[];
  searchableKeys?: Array<keyof T>;
  dateAccessor?: (row: T) => string | Date | null | undefined;
  filterDefinitions?: TableFilterDefinition<T>[];
  exportFileName: string;
  rowKey: (row: T, index: number) => string | number;
};

function parseDateValue(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DataTable<T>({
  title,
  description,
  data,
  columns,
  searchableKeys = [],
  dateAccessor,
  filterDefinitions = [],
  exportFileName,
  rowKey,
}: DataTableProps<T>) {
  const t = useTranslations("dataTable");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const searchMatches =
        !search ||
        searchableKeys.some((key) => {
          const value = row[key];
          return String(value ?? "")
            .toLowerCase()
            .includes(search.toLowerCase());
        });

      if (!searchMatches) {
        return false;
      }

      const rowDate = parseDateValue(dateAccessor?.(row));
      const from = parseDateValue(fromDate);
      const to = parseDateValue(toDate);

      if (rowDate && from && rowDate < from) {
        return false;
      }

      if (rowDate && to) {
        const inclusiveTo = new Date(to);
        inclusiveTo.setHours(23, 59, 59, 999);
        if (rowDate > inclusiveTo) {
          return false;
        }
      }

      const filtersMatch = filterDefinitions.every((definition) => {
        const selected = selectedFilters[definition.key];
        if (!selected) return true;
        return definition.accessor(row) === selected;
      });

      return filtersMatch;
    });
  }, [data, dateAccessor, filterDefinitions, fromDate, search, searchableKeys, selectedFilters, toDate]);

  function exportToExcel() {
    const exportRows = filteredData.map((row) => {
      return columns.reduce<Record<string, string | number | boolean | null | undefined>>((accumulator, column) => {
        accumulator[column.header] = column.exportValue ? column.exportValue(row) : String((row as Record<string, unknown>)[column.key] ?? "");
        return accumulator;
      }, {});
    });

    const sheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
    toast.success(`${exportRows.length} ${t("rows")}`);
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#171717]">
      {title || description ? (
        <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
          {title ? <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
      ) : null}

      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto]">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search")}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="mb-1 block text-xs font-medium">{t("from")}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="mb-1 block text-xs font-medium">{t("to")}</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2 lg:col-span-1 lg:grid-cols-1 xl:grid-cols-2">
            {filterDefinitions.map((definition) => (
              <label
                key={definition.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <span className="mb-1 block text-xs font-medium">{definition.label}</span>
                <select
                  value={selectedFilters[definition.key] ?? ""}
                  onChange={(event) =>
                    setSelectedFilters((current) => ({
                      ...current,
                      [definition.key]: event.target.value,
                    }))
                  }
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                >
                  <option value="">{t("all")}</option>
                  {definition.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/30 transition hover:bg-[#bb2319]"
          >
            <Download className="h-4 w-4" />
            <span>{t("export")}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={rowKey(row, index)} className="transition hover:bg-slate-50 dark:hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-5 py-4 text-sm text-slate-700 dark:text-slate-200 ${column.className ?? ""}`}>
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

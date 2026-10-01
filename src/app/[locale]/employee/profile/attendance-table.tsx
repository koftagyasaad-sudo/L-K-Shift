"use client";

import { DataTable } from "@/components/ui/data-table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";

type AttendanceTableRow = {
  id: number;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
  lateMinutes: number;
  overtimeMinutes: number;
  branch: string | null;
};

type FilterOption = {
  label: string;
  value: string;
};

export function AttendanceTable({
  data,
  locale,
  branchOptions,
  statusOptions,
}: {
  data: AttendanceTableRow[];
  locale: string;
  branchOptions: FilterOption[];
  statusOptions: FilterOption[];
}) {
  const t = useTranslations();

  return (
    <DataTable
      title={t("employeeProfile.historyTitle")}
      description={t("employeeProfile.historyDescription")}
      data={data}
      exportFileName="lk-shift-attendance-history"
      searchableKeys={["branch", "status"]}
      dateAccessor={(row) => row.date}
      filterDefinitions={[
        {
          key: "branch",
          label: t("employeeProfile.branch"),
          options: branchOptions,
          accessor: (row) => row.branch,
        },
        {
          key: "status",
          label: t("employeeProfile.status"),
          options: statusOptions,
          accessor: (row) => row.status,
        },
      ]}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "date",
          header: t("employeeProfile.attendanceDate"),
          render: (row) => formatDate(row.date, locale),
          exportValue: (row) => formatDate(row.date, locale),
        },
        {
          key: "branch",
          header: t("employeeProfile.branch"),
        },
        {
          key: "checkIn",
          header: t("employeeProfile.checkIn"),
          render: (row) => formatDateTime(row.checkIn, locale),
          exportValue: (row) => formatDateTime(row.checkIn, locale),
        },
        {
          key: "checkOut",
          header: t("employeeProfile.checkOut"),
          render: (row) => formatDateTime(row.checkOut, locale),
          exportValue: (row) => formatDateTime(row.checkOut, locale),
        },
        {
          key: "status",
          header: t("employeeProfile.status"),
          render: (row) => t(`status.${row.status}`),
          exportValue: (row) => t(`status.${row.status}`),
        },
        {
          key: "lateMinutes",
          header: t("employeeProfile.late"),
        },
        {
          key: "overtimeMinutes",
          header: t("employeeProfile.overtimeMinutes"),
        },
      ]}
    />
  );
}

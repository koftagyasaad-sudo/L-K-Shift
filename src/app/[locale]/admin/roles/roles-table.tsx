"use client";

import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";

type RoleTableRow = {
  id: number;
  name: string;
  nameAr: string;
  permissionCount: number;
  isSystem: string;
  createdAt: Date;
};

export function RolesTable({
  data,
  locale,
}: {
  data: RoleTableRow[];
  locale: string;
}) {
  const t = useTranslations();

  return (
    <DataTable
      title={t("adminRoles.tableTitle")}
      description={t("adminRoles.tableDescription")}
      data={data}
      exportFileName="lk-shift-roles"
      searchableKeys={["name", "nameAr"]}
      dateAccessor={(row) => row.createdAt}
      filterDefinitions={[
        {
          key: "system",
          label: t("adminRoles.system"),
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
          accessor: (row) => row.isSystem,
        },
      ]}
      rowKey={(row) => row.id}
      columns={[
        { key: "name", header: t("adminRoles.role") },
        { key: "nameAr", header: t("adminRoles.roleAr") },
        { key: "permissionCount", header: t("adminRoles.permissionCount") },
        {
          key: "isSystem",
          header: t("adminRoles.system"),
          render: (row) => (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
              {row.isSystem}
            </span>
          ),
          exportValue: (row) => row.isSystem,
        },
        {
          key: "createdAt",
          header: t("adminRoles.createdAt"),
          render: (row) => formatDate(row.createdAt, locale),
          exportValue: (row) => formatDate(row.createdAt, locale),
        },
      ]}
    />
  );
}

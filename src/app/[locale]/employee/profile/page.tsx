import { ActionDialog } from "@/components/ui/action-dialog";
import { DataTable } from "@/components/ui/data-table";
import { db } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { attendanceLogs, branches } from "@/db/schema";
import { formatDate, formatDateTime, formatMinutesAsHours } from "@/lib/utils";
import { requireSession } from "@/lib/auth-guards";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import {
  createExceptionRequestAction,
  createLeaveRequestAction,
  justifyMissedDayAction,
} from "./actions";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await ensureSeedData();
  const session = await requireSession(locale);
  const t = await getTranslations();

  const attendanceRows = await db
    .select({
      id: attendanceLogs.id,
      workDate: attendanceLogs.workDate,
      checkInTime: attendanceLogs.checkInTime,
      checkOutTime: attendanceLogs.checkOutTime,
      status: attendanceLogs.status,
      lateMinutes: attendanceLogs.lateMinutes,
      overtimeMinutes: attendanceLogs.overtimeMinutes,
      branchNameAr: branches.nameAr,
      branchNameEn: branches.nameEn,
    })
    .from(attendanceLogs)
    .innerJoin(branches, eq(branches.id, attendanceLogs.branchId))
    .where(eq(attendanceLogs.userId, Number(session.user.id)));

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRows = attendanceRows.filter((row) => {
    const workDate = new Date(row.workDate);
    return workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear;
  });

  const stats = {
    presentDays: monthRows.filter((row) => row.status === "ON_TIME" || row.status === "LATE").length,
    lateMinutes: monthRows.reduce((sum, row) => sum + row.lateMinutes, 0),
    overtimeMinutes: monthRows.reduce((sum, row) => sum + row.overtimeMinutes, 0),
    absences: monthRows.filter((row) => row.status === "ABSENT").length,
  };

  const tableRows = attendanceRows.map((row) => ({
    id: row.id,
    date: row.workDate,
    checkIn: row.checkInTime,
    checkOut: row.checkOutTime,
    status: row.status,
    lateMinutes: row.lateMinutes,
    overtimeMinutes: row.overtimeMinutes,
    branch: locale === "ar" ? row.branchNameAr : row.branchNameEn,
  }));

  const branchOptions = Array.from(new Set(tableRows.map((row) => row.branch))).map((branch) => ({
    label: branch,
    value: branch,
  }));

  const statusOptions = Array.from(new Set(tableRows.map((row) => row.status))).map((status) => ({
    label: t(`status.${status}`),
    value: status,
  }));

  const statCards = [
    { label: t("employeeProfile.presentDays"), value: stats.presentDays },
    { label: t("employeeProfile.lateMinutes"), value: stats.lateMinutes },
    { label: t("employeeProfile.overtime"), value: formatMinutesAsHours(stats.overtimeMinutes) },
    { label: t("employeeProfile.absences"), value: stats.absences },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[#121212] p-8 text-white shadow-2xl shadow-black/20">
        <h1 className="text-4xl font-black">{t("employeeProfile.title")}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">{t("employeeProfile.subtitle")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]"
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]">
        <div className="flex flex-wrap gap-3">
          <ActionDialog triggerLabel={t("employeeProfile.leaveDialog")} title={t("employeeProfile.leaveDialog")}>
            <form action={createLeaveRequestAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.leaveType")}</span>
                <select name="leaveType" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.startDate")}</span>
                  <input type="date" name="startDate" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.endDate")}</span>
                  <input type="date" name="endDate" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.reason")}</span>
                <textarea name="reason" rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
              </label>
              <button type="submit" className="rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>

          <ActionDialog triggerLabel={t("employeeProfile.excuseDialog")} title={t("employeeProfile.excuseDialog")}>
            <form action={createExceptionRequestAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.workDate")}</span>
                <input type="date" name="workDate" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.exceptionType")}</span>
                <select name="exceptionType" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <option value="FORGOT_CHECK_IN">Forgot check-in</option>
                  <option value="FORGOT_CHECK_OUT">Forgot check-out</option>
                  <option value="DEVICE_ISSUE">Device issue</option>
                  <option value="GPS_ISSUE">GPS issue</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.requestedCheckIn")}</span>
                  <input type="datetime-local" name="requestedCheckIn" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.requestedCheckOut")}</span>
                  <input type="datetime-local" name="requestedCheckOut" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.description")}</span>
                <textarea name="description" rows={4} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
              </label>
              <button type="submit" className="rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>

          <ActionDialog triggerLabel={t("employeeProfile.missedDayDialog")} title={t("employeeProfile.missedDayDialog")}>
            <form action={justifyMissedDayAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.workDate")}</span>
                <input type="date" name="workDate" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("employeeProfile.description")}</span>
                <textarea name="description" rows={4} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" />
              </label>
              <button type="submit" className="rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>
        </div>
      </section>

      <DataTable
        title={t("employeeProfile.historyTitle")}
        description={t("employeeProfile.historyDescription")}
        data={tableRows}
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
    </div>
  );
}

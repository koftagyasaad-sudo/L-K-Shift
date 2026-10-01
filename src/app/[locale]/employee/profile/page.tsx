import { ActionDialog } from "@/components/ui/action-dialog";
import { db } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { attendanceLogs, branches } from "@/db/schema";
import { formatMinutesAsHours } from "@/lib/utils";
import { requireSession } from "@/lib/auth-guards";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import {
  createExceptionRequestAction,
  createLeaveRequestAction,
  justifyMissedDayAction,
} from "./actions";
import { AttendanceTable } from "./attendance-table";

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
    label: branch ?? "",
    value: branch ?? "",
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
      <section className="gradient-hero relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-black">{t("employeeProfile.title")}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">{t("employeeProfile.subtitle")}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
          >
            <p className="text-sm text-foreground-muted">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-foreground">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <ActionDialog triggerLabel={t("employeeProfile.leaveDialog")} title={t("employeeProfile.leaveDialog")}>
            <form action={createLeaveRequestAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.leaveType")}</span>
                <select name="leaveType" className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground">
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.startDate")}</span>
                  <input type="date" name="startDate" required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.endDate")}</span>
                  <input type="date" name="endDate" required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.reason")}</span>
                <textarea name="reason" rows={4} className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
              </label>
              <button type="submit" className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>

          <ActionDialog triggerLabel={t("employeeProfile.excuseDialog")} title={t("employeeProfile.excuseDialog")}>
            <form action={createExceptionRequestAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.workDate")}</span>
                <input type="date" name="workDate" required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.exceptionType")}</span>
                <select name="exceptionType" className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground">
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
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.requestedCheckIn")}</span>
                  <input type="datetime-local" name="requestedCheckIn" className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.requestedCheckOut")}</span>
                  <input type="datetime-local" name="requestedCheckOut" className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.description")}</span>
                <textarea name="description" rows={4} required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
              </label>
              <button type="submit" className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>

          <ActionDialog triggerLabel={t("employeeProfile.missedDayDialog")} title={t("employeeProfile.missedDayDialog")}>
            <form action={justifyMissedDayAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.workDate")}</span>
                <input type="date" name="workDate" required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("employeeProfile.description")}</span>
                <textarea name="description" rows={4} required className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground" />
              </label>
              <button type="submit" className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{t("employeeProfile.submit")}</button>
            </form>
          </ActionDialog>
        </div>
      </section>

      <AttendanceTable
        data={tableRows}
        locale={locale}
        branchOptions={branchOptions}
        statusOptions={statusOptions}
      />
    </div>
  );
}

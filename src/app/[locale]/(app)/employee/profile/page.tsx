// src/app/[locale]/(app)/employee/profile/page.tsx
import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.id) {
    return (
      <div className="rounded-[24px] border border-border bg-surface p-8 text-center">
        <p className="text-foreground-muted">
          {locale === "ar" ? "يجب تسجيل الدخول أولاً" : "Please sign in first"}
        </p>
      </div>
    );
  }

  // ⚠️ users.id عندك integer، وsession.user.id غالبًا string من NextAuth.
  // هنحوّله لرقم هنا. لو عندك type مختلف في auth.ts هنحتاج نعدّل السطر ده.
  const currentUserId = Number(session.user.id);

  const userRow = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  const currentUser = userRow[0];

  const myAttendance = await db
    .select()
    .from(attendanceLogs)
    .where(eq(attendanceLogs.userId, currentUserId))
    .orderBy(attendanceLogs.workDate);

  const totalRecords = myAttendance.length;
  const onTime = myAttendance.filter((a) => a.status === "ON_TIME").length;
  const late = myAttendance.filter((a) => a.status === "LATE").length;
  const absent = myAttendance.filter((a) => a.status === "ABSENT").length;

  const displayName = currentUser
    ? locale === "ar"
      ? currentUser.fullNameAr
      : (currentUser.fullNameEn ?? currentUser.fullNameAr)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "الملف الشخصي" : "Employee Profile"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted" dir="ltr">
          {displayName} — {currentUser?.phone}
        </p>
        {currentUser?.jobRole && (
          <p className="mt-1 text-xs text-foreground-subtle">{currentUser.jobRole}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-border bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-foreground">{onTime}</p>
          <p className="mt-1 text-sm text-foreground-muted">{t("status.ON_TIME")}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-foreground">{late}</p>
          <p className="mt-1 text-sm text-foreground-muted">{t("status.LATE")}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-foreground">{absent}</p>
          <p className="mt-1 text-sm text-foreground-muted">{t("status.ABSENT")}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {locale === "ar" ? "سجل الحضور" : "Attendance History"}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-foreground-muted">
              <th className="p-3 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحضور" : "Check-in"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الانصراف" : "Check-out"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {myAttendance.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="p-3 text-foreground">{String(log.workDate)}</td>
                <td className="p-3 text-foreground-muted" dir="ltr">
                  {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "—"}
                </td>
                <td className="p-3 text-foreground-muted" dir="ltr">
                  {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "—"}
                </td>
                <td className="p-3">
                  <span className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold">
                    {t(`status.${log.status}`)}
                  </span>
                </td>
              </tr>
            ))}
            {totalRecords === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-foreground-muted">
                  {locale === "ar" ? "لا توجد سجلات حضور" : "No attendance records"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

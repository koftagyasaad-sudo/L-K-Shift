import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowLeft, MapPin, Wifi, Users as UsersIcon } from "lucide-react";

export default async function BranchDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const branchId = Number(id);

  if (!branchId || Number.isNaN(branchId)) {
    notFound();
  }

  const t = await getTranslations();
  const typedLocale = locale as "ar" | "en";

  const [branch] = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1);
  if (!branch) {
    notFound();
  }

  const employees = await db.select().from(users).where(eq(users.primaryBranchId, branchId));
  const attendanceRows = await db
    .select()
    .from(attendanceLogs)
    .where(eq(attendanceLogs.branchId, branchId))
    .orderBy(attendanceLogs.workDate);

  const total = attendanceRows.length;
  const onTime = attendanceRows.filter((a) => a.status === "ON_TIME").length;
  const late = attendanceRows.filter((a) => a.status === "LATE").length;
  const absent = attendanceRows.filter((a) => a.status === "ABSENT").length;
  const presentRate = total > 0 ? Math.round(((onTime + late) / total) * 100) : 0;

  const BackIcon = typedLocale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-8">
      <Link
        href="/"
        locale={typedLocale}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-accent"
      >
        <BackIcon className="h-4 w-4" />
        <span>{typedLocale === "ar" ? "الرجوع للرئيسية" : "Back to overview"}</span>
      </Link>

      <section className="gradient-hero relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
            {branch.type.replaceAll("_", " ")}
          </span>
          <h1 className="mt-4 text-3xl font-black lg:text-4xl">
            {typedLocale === "ar" ? branch.nameAr : branch.nameEn}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/85">
            <MapPin className="h-4 w-4" />
            <span>{branch.address}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground-muted">{typedLocale === "ar" ? "عدد الموظفين" : "Employees"}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{employees.length}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground-muted">{t("status.ON_TIME")}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{onTime}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground-muted">{t("status.LATE")}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{late}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground-muted">{t("status.ABSENT")}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{absent}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{typedLocale === "ar" ? "نسبة الحضور" : "Attendance rate"}</h2>
          <span className="text-accent text-2xl font-black">{presentRate}%</span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-background-secondary">
          <div className="gradient-hero h-full rounded-full" style={{ width: `${presentRate}%` }} />
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground">{typedLocale === "ar" ? "الموظفون" : "Employees"}</h2>
        <div className="mt-4 space-y-3">
          {employees.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              {typedLocale === "ar" ? "لا يوجد موظفون في هذا الفرع" : "No employees assigned"}
            </p>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between rounded-2xl border border-border bg-background-secondary px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-full">
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {typedLocale === "ar" ? employee.fullNameAr : employee.fullNameEn ?? employee.fullNameAr}
                    </p>
                    <p className="text-xs text-foreground-muted">{employee.jobRole}</p>
                  </div>
                </div>
                <span className="rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-foreground-muted">
                  {employee.systemRole.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {branch.wifiSsid ? (
        <section className="flex items-center gap-3 rounded-[24px] border border-border bg-surface p-5 text-sm text-foreground-muted shadow-sm">
          <Wifi className="h-4 w-4" />
          <span>Wi-Fi: {branch.wifiSsid}</span>
        </section>
      ) : null}
    </div>
  );
}

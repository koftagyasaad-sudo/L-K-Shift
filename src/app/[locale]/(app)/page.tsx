// src/app/[locale]/(app)/page.tsx
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { getTranslations } from "next-intl/server";
import { Building2, Users as UsersIcon, CalendarCheck, ArrowUpRight, UserX } from "lucide-react";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations();
  const typedLocale = locale as "ar" | "en";

  const branchRows = await db.select().from(branches).orderBy(branches.id);
  const userRows = await db.select({ id: users.id, primaryBranchId: users.primaryBranchId }).from(users);
  const attendanceRows = await db
    .select({ branchId: attendanceLogs.branchId, status: attendanceLogs.status })
    .from(attendanceLogs);

  const branchSummaries = branchRows.map((branch) => {
    const employeeCount = userRows.filter((u) => u.primaryBranchId === branch.id).length;
    const branchAttendance = attendanceRows.filter((a) => a.branchId === branch.id);
    const total = branchAttendance.length;
    const onTime = branchAttendance.filter((a) => a.status === "ON_TIME").length;
    const late = branchAttendance.filter((a) => a.status === "LATE").length;
    const absent = branchAttendance.filter((a) => a.status === "ABSENT").length;
    const presentRate = total > 0 ? Math.round(((onTime + late) / total) * 100) : 0;

    return { ...branch, employeeCount, onTime, late, absent, presentRate };
  });

  const totalEmployees = userRows.length;
  const totalAttendance = attendanceRows.length;
  const totalAbsences = attendanceRows.filter((a) => a.status === "ABSENT").length;

  // تم فصل الـ href الخاص بالموظفين خارج الـ array لتطبيق as const بشكل صحيح
  const employeesHref =
    session?.user?.systemRole === "SUPER_ADMIN"
      ? ("/admin/roles" as const)
      : ("/employee/profile" as const);

  const statCards = [
    { label: t("home.statsBranches"), value: branchRows.length, icon: Building2, href: "#branches" as const },
    {
      label: t("home.statsUsers"),
      value: totalEmployees,
      icon: UsersIcon,
      href: employeesHref,
    },
    { label: t("home.statsAttendance"), value: totalAttendance, icon: CalendarCheck, href: "/employee/profile" as const },
    { label: t("employeeProfile.absences"), value: totalAbsences, icon: UserX, href: "/employee/profile" as const },
  ];

  return (
    <div className="space-y-8">
      <section className="gradient-hero relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">{t("home.heroEyebrow")}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight lg:text-4xl">{t("home.heroTitle")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85">{t("home.heroDescription")}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              locale={typedLocale}
              className="group rounded-[24px] border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="bg-accent/10 text-accent flex h-11 w-11 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="text-foreground-subtle h-4 w-4 transition group-hover:text-accent" />
              </div>
              <p className="mt-4 text-sm text-foreground-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-black text-foreground">{stat.value}</p>
            </Link>
          );
        })}
      </section>

      <section id="branches" className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t("home.branchesTitle")}</h2>
          <p className="mt-1 text-sm text-foreground-muted">{t("home.branchesDescription")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branchSummaries.map((branch) => (
            <Link
              key={branch.id}
              href={`/branches/${branch.id}`}
              locale={typedLocale}
              className="group rounded-[24px] border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {locale === "ar" ? branch.nameAr : branch.nameEn}
                  </h3>
                  <p className="mt-1 text-xs text-foreground-muted">{branch.address}</p>
                </div>
                <span className="bg-accent/10 text-accent whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">
                  {branch.type.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                <span>{branch.employeeCount} {locale === "ar" ? "موظف" : "employees"}</span>
                <span className="font-semibold text-foreground">{branch.presentRate}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background-secondary">
                <div className="gradient-hero h-full rounded-full" style={{ width: `${branch.presentRate}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl bg-background-secondary py-2">
                  <p className="font-bold text-foreground">{branch.onTime}</p>
                  <p className="text-foreground-muted">{t("status.ON_TIME")}</p>
                </div>
                <div className="rounded-xl bg-background-secondary py-2">
                  <p className="font-bold text-foreground">{branch.late}</p>
                  <p className="text-foreground-muted">{t("status.LATE")}</p>
                </div>
                <div className="rounded-xl bg-background-secondary py-2">
                  <p className="font-bold text-foreground">{branch.absent}</p>
                  <p className="text-foreground-muted">{t("status.ABSENT")}</p>
                </div>
              </div>

              <div className="text-accent mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100">
                <span>{locale === "ar" ? "عرض التفاصيل" : "View details"}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

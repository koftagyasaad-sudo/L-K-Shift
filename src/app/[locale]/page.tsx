import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, branches, notifications, users } from "@/db/schema";
import { ensureSeedData } from "@/db/seed";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { count, desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await ensureSeedData();

  const session = await auth();
  const t = await getTranslations();

  const [branchRows, userCountRows, attendanceCountRows, unreadRows] = await Promise.all([
    db.select().from(branches).orderBy(branches.id),
    db.select({ value: count(users.id) }).from(users),
    db.select({ value: count(attendanceLogs.id) }).from(attendanceLogs),
    session?.user?.id
      ? db
          .select({ value: count(notifications.id) })
          .from(notifications)
          .where(eq(notifications.userId, Number(session.user.id)))
      : Promise.resolve([{ value: 0 }]),
  ]);

  const stats = [
    { label: t("home.statsBranches"), value: branchRows.length },
    { label: t("home.statsUsers"), value: userCountRows[0]?.value ?? 0 },
    { label: t("home.statsNotifications"), value: unreadRows[0]?.value ?? 0 },
    { label: t("home.statsAttendance"), value: attendanceCountRows[0]?.value ?? 0 },
  ];

  const featureKeys = ["i18n", "theme", "auth", "notifications", "tables"] as const;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[#121212] p-8 text-white shadow-2xl shadow-black/20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ffb3ae]">{t("home.heroEyebrow")}</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight lg:text-5xl">{t("home.heroTitle")}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">{t("home.heroDescription")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={session?.user?.systemRole === "SUPER_ADMIN" ? "/admin/roles" : "/employee/profile"}
                locale={locale as "ar" | "en"}
                className="rounded-full bg-[#D8261C] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/35 transition hover:bg-[#b92018]"
              >
                {session?.user?.systemRole === "SUPER_ADMIN" ? t("home.openAdmin") : t("home.openProfile")}
              </Link>
              <Link
                href="/login"
                locale={locale as "ar" | "en"}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("home.viewLogin")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/70">{stat.label}</p>
                <p className="mt-3 text-3xl font-black">{stat.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t("home.branchesTitle")}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("home.branchesDescription")}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {branchRows.map((branch) => (
              <article
                key={branch.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                      {locale === "ar" ? branch.nameAr : branch.nameEn}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{branch.address}</p>
                  </div>
                  <span className="rounded-full bg-[#D8261C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#D8261C]">
                    {branch.type.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 dark:text-slate-300">
                  <div>Lat: {branch.latitude}</div>
                  <div>Lng: {branch.longitude}</div>
                  <div>Geofence: {branch.geofenceRadius}m</div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t("home.featuresTitle")}</h2>
            <div className="mt-5 space-y-3">
              {featureKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {t(`home.features.${key}`)}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t("home.demoCredentials")}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">{t("auth.adminDemo")}</div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">{t("auth.employeeDemo")}</div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">{formatDate(new Date(), locale)}</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

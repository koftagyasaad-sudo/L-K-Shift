import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, branches, notifications, users } from "@/db/schema";
import { ensureSeedData } from "@/db/seed";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { count, eq } from "drizzle-orm";
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
      <section className="gradient-hero relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">
            {t("home.heroEyebrow")}
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight lg:text-5xl">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">
                {t("home.heroDescription")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={session?.user?.systemRole === "SUPER_ADMIN" ? "/admin/roles" : "/employee/profile"}
                  locale={locale as "ar" | "en"}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg shadow-black/20 transition hover:bg-white/90"
                >
                  {session?.user?.systemRole === "SUPER_ADMIN" ? t("home.openAdmin") : t("home.openProfile")}
                </Link>
                <Link
                  href="/login"
                  locale={locale as "ar" | "en"}
                  className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t("home.viewLogin")}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <p className="text-sm text-white/80">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black">{stat.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("home.branchesTitle")}</h2>
              <p className="mt-2 text-sm text-foreground-muted">{t("home.branchesDescription")}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {branchRows.map((branch) => (
              <article
                key={branch.id}
                className="rounded-3xl border border-border bg-background-secondary p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {locale === "ar" ? branch.nameAr : branch.nameEn}
                    </h3>
                    <p className="mt-1 text-sm text-foreground-muted">{branch.address}</p>
                  </div>
                  <span className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                    {branch.type.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-foreground-muted sm:grid-cols-3">
                  <div>Lat: {branch.latitude}</div>
                  <div>Lng: {branch.longitude}</div>
                  <div>Geofence: {branch.geofenceRadius}m</div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">{t("home.featuresTitle")}</h2>
            <div className="mt-5 space-y-3">
              {featureKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-3xl border border-border bg-background-secondary px-4 py-4 text-sm text-foreground-muted"
                >
                  {t(`home.features.${key}`)}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">{t("home.demoCredentials")}</h2>
            <div className="mt-4 space-y-3 text-sm text-foreground-muted">
              <div className="rounded-3xl bg-background-secondary p-4">{t("auth.adminDemo")}</div>
              <div className="rounded-3xl bg-background-secondary p-4">{t("auth.employeeDemo")}</div>
              <div className="rounded-3xl bg-background-secondary p-4">{formatDate(new Date(), locale)}</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

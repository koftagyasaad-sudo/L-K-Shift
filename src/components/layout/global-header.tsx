import { auth } from "@/auth";
import { getRecentNotifications } from "@/db/seed";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "./notification-bell";
import { ThemeSwitcher } from "./theme-switcher";
import { UserMenu } from "./user-menu";
import { getTranslations } from "next-intl/server";

export async function GlobalHeader({ locale }: { locale: "ar" | "en" }) {
  const session = await auth();
  const t = await getTranslations("header");

  const notifications = session?.user?.id
    ? await getRecentNotifications(Number(session.user.id))
    : [];

  const navItems = [
    { href: "/", label: t("overview") },
    ...(session?.user?.systemRole === "SUPER_ADMIN"
      ? [{ href: "/admin/roles", label: t("adminRoles") }]
      : []),
    ...(session?.user ? [{ href: "/employee/profile", label: t("employeeProfile") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121212]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" locale={locale} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8261C] text-lg font-black text-white shadow-lg shadow-[#D8261C]/35">
                LK
              </div>
              <div>
                <p className="text-lg font-bold text-white">L&amp;K Shift</p>
                <p className="text-sm text-white/70">Lion Broast &amp; Koftagi Workforce Hub</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {session?.user ? (
              <>
                <NotificationBell
                  initialNotifications={notifications.map((item) => ({
                    id: item.id,
                    title: item.title,
                    message: item.message,
                    link: item.link,
                    isRead: item.isRead,
                    createdAt: item.createdAt.toISOString(),
                  }))}
                />
                <UserMenu
                  name={session.user.fullNameEn ?? session.user.fullNameAr}
                  role={session.user.systemRole}
                />
              </>
            ) : (
              <Link
                href="/login"
                locale={locale}
                className="rounded-full bg-[#D8261C] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/35 transition hover:bg-[#b81f17]"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

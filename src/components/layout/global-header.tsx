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

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 ps-16 sm:px-6 lg:ps-6 lg:px-8">
        <div className="gradient-hero flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white lg:hidden">
          LK
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
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

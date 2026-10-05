// src/components/layout/global-header.tsx
import { auth } from "@/auth";
import { getRecentNotifications } from "@/db/seed";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
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
      <div className="flex items-center justify-between gap-3 px-4 py-3 ps-16 sm:px-6 lg:ps-6 lg:px-8">
        <div className="order-1 flex flex-wrap items-center gap-1.5">
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
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
            >
              {t("login")}
            </Link>
          )}
        </div>

        <div className="order-2 gradient-hero relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-1 lg:hidden">
          <Image src="/Logo.png" alt="L&K Shift" fill sizes="32px" className="object-contain p-1" />
        </div>
      </div>
    </header>
  );
}

import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GlobalHeader } from "@/components/layout/global-header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("header");
  const typedLocale = locale as "ar" | "en";
  const dir = typedLocale === "ar" ? "rtl" : "ltr";
  const logoutLabel = typedLocale === "ar" ? "تسجيل الخروج" : "Logout";

  return (
    <div dir={dir} className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        locale={typedLocale}
        isSuperAdmin={session.user.systemRole === "SUPER_ADMIN"}
        isAuthenticated
        labels={{
          overview: t("overview"),
          adminRoles: t("adminRoles"),
          employeeProfile: t("employeeProfile"),
          logout: logoutLabel,
        }}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <GlobalHeader locale={typedLocale} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

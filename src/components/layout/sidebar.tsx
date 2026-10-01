"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Shield,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

type SidebarProps = {
  locale: "ar" | "en";
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  labels: {
    overview: string;
    adminRoles: string;
    employeeProfile: string;
    settings: string;
    logout: string;
  };
};

export function Sidebar({ locale, isSuperAdmin, isAuthenticated, labels }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: labels.overview, icon: LayoutDashboard, show: true },
    { href: "/admin/roles", label: labels.adminRoles, icon: Shield, show: isSuperAdmin },
    { href: "/employee/profile", label: labels.employeeProfile, icon: UserCircle, show: isAuthenticated },
  ].filter((item) => item.show);

  const side = locale === "ar" ? "right" : "left";
  const borderSide = side === "right" ? "border-l" : "border-r";

  return (
    <>
      {/* زر فتح القائمة على الموبايل */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 z-50 rounded-full border border-border bg-surface p-3 shadow-lg lg:hidden"
        style={{ [side]: "1rem" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* الخلفية المعتمة عند فتح القائمة على الموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 z-50 flex h-screen w-72 flex-col bg-surface ${borderSide} border-border transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          side === "right"
            ? mobileOpen
              ? "right-0 translate-x-0"
              : "right-0 translate-x-full lg:translate-x-0"
            : mobileOpen
              ? "left-0 translate-x-0"
              : "left-0 -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
          <Link href="/" locale={locale} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-hero text-lg font-black text-white shadow-lg">
              LK
            </div>
            <div>
              <p className="text-base font-bold text-foreground">L&amp;K Shift</p>
              <p className="text-xs text-foreground-muted">Workforce Hub</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-full p-2 hover:bg-background-secondary lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && (
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-danger transition hover:bg-danger/10"
            >
              <LogOut className="h-5 w-5" />
              <span>{labels.logout}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

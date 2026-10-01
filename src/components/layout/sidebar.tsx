"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Shield, UserCircle, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type SidebarProps = {
  locale: "ar" | "en";
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  labels: {
    overview: string;
    adminRoles: string;
    employeeProfile: string;
    logout: string;
  };
};

export function Sidebar({ locale, isSuperAdmin, isAuthenticated, labels }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = locale === "ar";
  const borderSide = isRtl ? "border-l" : "border-r";

  const navItems: NavItem[] = [
    { href: "/", label: labels.overview, icon: LayoutDashboard },
    ...(isSuperAdmin ? [{ href: "/admin/roles", label: labels.adminRoles, icon: Shield }] : []),
    ...(isAuthenticated
      ? [{ href: "/employee/profile", label: labels.employeeProfile, icon: UserCircle }]
      : []),
  ];

  function Brand() {
    return (
      <Link href="/" locale={locale} className="flex items-center gap-3">
        <div className="gradient-hero flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg">
          LK
        </div>
        <div>
          <p className="text-base font-bold text-foreground">L&amp;K Shift</p>
          <p className="text-xs text-foreground-muted">Workforce Hub</p>
        </div>
      </Link>
    );
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              onClick={onNavigate}
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
    );
  }

  function LogoutButton({ onNavigate }: { onNavigate?: () => void }) {
    if (!isAuthenticated) return null;
    return (
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut({ callbackUrl: `/${locale}/login` });
          }}
          className="text-danger hover:bg-danger/10 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition"
        >
          <LogOut className="h-5 w-5" />
          <span>{labels.logout}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar ثابت على الديسكتوب */}
      <aside
        className={`sticky top-0 hidden h-screen w-72 flex-col bg-surface ${borderSide} border-border lg:flex`}
      >
        <div className="border-b border-border px-6 py-5">
          <Brand />
        </div>
        <NavLinks />
        <LogoutButton />
      </aside>

      {/* زر فتح القائمة على الموبايل */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 z-50 rounded-full border border-border bg-surface p-3 shadow-lg lg:hidden"
        style={{ [isRtl ? "right" : "left"]: "1rem" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* الخلفية المعتمة + القائمة المنسدلة على الموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 z-50 flex h-screen w-72 flex-col bg-surface ${borderSide} border-border transition-transform duration-300 lg:hidden ${
          isRtl
            ? mobileOpen
              ? "right-0 translate-x-0"
              : "right-0 translate-x-full"
            : mobileOpen
              ? "left-0 translate-x-0"
              : "left-0 -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-full p-2 hover:bg-background-secondary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>
        <NavLinks onNavigate={() => setMobileOpen(false)} />
        <LogoutButton onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

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
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg font-black text-white backdrop-blur-sm">
          LK
        </div>
        <div>
          <p className="text-base font-bold text-white">L&amp;K Shift</p>
          <p className="text-xs text-white/80">Workforce Hub</p>
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
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
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
      <aside className={`sticky top-0 hidden h-screen w-72 flex-col bg-surface ${borderSide} border-border lg:flex`}>
        <div className="gradient-hero px-6 py-6">
          <Brand />
        </div>
        <div className="sidebar-glow flex flex-1 flex-col">
          <NavLinks />
          <LogoutButton />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 z-50 rounded-full border border-border bg-surface p-3 shadow-lg lg:hidden"
        style={{ [isRtl ? "right" : "left"]: "1rem" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 z-50 flex h-screen w-72 flex-col bg-surface ${borderSide} border-border transition-transform duration-300 lg:hidden ${
          isRtl
            ? mobileOpen ? "right-0 translate-x-0" : "right-0 translate-x-full"
            : mobileOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full"
        }`}
      >
        <div className="gradient-hero flex items-center justify-between gap-3 px-6 py-6">
          <Brand />
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded-full p-2 text-white hover:bg-white/10" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="sidebar-glow flex flex-1 flex-col">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <LogoutButton onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>
    </>
  );
}

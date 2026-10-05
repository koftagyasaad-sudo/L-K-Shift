// src/components/layout/sidebar.tsx
"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Shield,
  UserCircle,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useSidebarStore } from "@/stores/sidebar-store";

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
    manageEmployees: string;
    logout: string;
    mySalary?: string;
  };
};

export function Sidebar({ locale, isSuperAdmin, isAuthenticated, labels }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggle);
  const isRtl = locale === "ar";
  const borderSide = isRtl ? "border-l" : "border-r";
  const mySalaryLabel = labels.mySalary ?? (isRtl ? "راتبي" : "My Salary");

  const navItems: NavItem[] = [
    { href: "/", label: labels.overview, icon: LayoutDashboard },
    ...(isSuperAdmin
      ? [
          { href: "/admin/employees", label: labels.manageEmployees, icon: Users },
          { href: "/admin/roles", label: labels.adminRoles, icon: Shield },
        ]
      : []),
    ...(isAuthenticated
      ? [
          { href: "/employee/profile", label: labels.employeeProfile, icon: UserCircle },
          { href: "/employee/salary", label: mySalaryLabel, icon: Wallet },
        ]
      : []),
  ];

  const CollapseIcon = isRtl
    ? collapsed
      ? ChevronLeft
      : ChevronRight
    : collapsed
      ? ChevronRight
      : ChevronLeft;

  function Brand({ showText }: { showText: boolean }) {
    return (
      <Link
        href="/"
        locale={locale}
        className="flex flex-col items-center gap-2 text-center"
      >
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm transition-all duration-300 ${
            showText ? "h-24 w-24 p-3" : "h-12 w-12 p-2"
          }`}
        >
          <Image
            src="/Logo.png"
            alt="L&K Shift"
            fill
            sizes="96px"
            className="object-contain p-2"
            priority
          />
        </div>
        {showText ? (
          <div>
            <p className="text-lg font-bold text-white">L&amp;K Shift</p>
            <p className="text-xs text-white/80">Workforce Hub</p>
          </div>
        ) : null}
      </Link>
    );
  }

  function NavLinks({ onNavigate, showLabels }: { onNavigate?: () => void; showLabels: boolean }) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              onClick={onNavigate}
              title={!showLabels ? item.label : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                showLabels ? "" : "justify-center"
              } ${
                isActive
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showLabels ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen flex-col bg-surface ${borderSide} border-border transition-all duration-300 lg:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* رأس الشريط: زرار الطي + اللوجو الكبير المتوسط، كل ده في الـ flow الطبيعي بدون absolute */}
        <div
          className={`gradient-hero flex flex-col transition-all duration-300 ${
            collapsed ? "px-2 py-4" : "px-4 py-6"
          }`}
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <CollapseIcon className="h-4 w-4" />
            </button>
          </div>

          <Brand showText={!collapsed} />
        </div>

        <div className="sidebar-glow flex flex-1 flex-col">
          <NavLinks showLabels={!collapsed} />
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
            ? mobileOpen
              ? "right-0 translate-x-0"
              : "right-0 translate-x-full"
            : mobileOpen
              ? "left-0 translate-x-0"
              : "left-0 -translate-x-full"
        }`}
      >
        <div className="gradient-hero flex items-center justify-between gap-3 px-6 py-6">
          <Brand showText />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="sidebar-glow flex flex-1 flex-col">
          <NavLinks onNavigate={() => setMobileOpen(false)} showLabels />
        </div>
      </aside>
    </>
  );
}

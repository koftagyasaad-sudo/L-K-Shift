"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Clock,
  ClipboardCheck,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function Sidebar({
  isOpen,
  toggleSidebar,
  locale,
  collapsed,
  toggleCollapsed,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
  locale: string;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const isRtl = locale === "ar";
  const pathname = usePathname();

  const links = [
    {
      href: `/${locale}`,
      label: isRtl ? "لوحة التحكم" : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/attendance`,
      label: isRtl ? "الحضور والانصراف" : "Attendance",
      icon: Clock,
    },
    {
      href: `/${locale}/admin/employees`,
      label: isRtl ? "الموظفين" : "Employees",
      icon: Users,
    },
    {
      href: `/${locale}/admin/branches`,
      label: isRtl ? "الفروع" : "Branches",
      icon: Building2,
    },
    {
      href: `/${locale}/admin/roles`,
      label: isRtl ? "الأدوار" : "Roles",
      icon: Shield,
    },
    {
      href: `/${locale}/admin/attendance-review`,
      label: isRtl ? "مراجعة الحضور" : "Attendance Review",
      icon: ClipboardCheck,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  const CollapseIcon = isRtl
    ? collapsed
      ? ChevronsLeft
      : ChevronsRight
    : collapsed
      ? ChevronsRight
      : ChevronsLeft;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 z-50 shrink-0
          bg-gradient-to-b from-orange-500 via-orange-500 to-pink-500
          text-white shadow-2xl
          transition-all duration-300 ease-in-out
          ${isRtl ? "right-0" : "left-0"}
          ${collapsed ? "lg:w-20" : "lg:w-72"}
          w-72
          ${
            isOpen
              ? "translate-x-0"
              : isRtl
                ? "translate-x-full lg:translate-x-0"
                : "-translate-x-full lg:translate-x-0"
          }
          flex flex-col
        `}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-3 h-16 border-b border-white/20">
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <img
              src="/Logo.png"
              alt="L-K Shift"
              className="h-9 w-9 object-contain bg-white/20 rounded-xl p-1 backdrop-blur-md shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0 hidden lg:block">
                <p className="font-black text-base leading-tight truncate">L-K Shift</p>
                <p className="text-[10px] text-white/80 truncate">
                  {isRtl ? "نظام الحضور والورديات" : "Attendance System"}
                </p>
              </div>
            )}
            {/* Mobile always show title */}
            <div className="min-w-0 lg:hidden">
              <p className="font-black text-base leading-tight truncate">L-K Shift</p>
              <p className="text-[10px] text-white/80 truncate">
                {isRtl ? "نظام الحضور والورديات" : "Attendance System"}
              </p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
            type="button"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
                className={`
                  flex items-center gap-3 rounded-2xl text-sm font-bold transition-all
                  ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 px-4 py-3" : "px-4 py-3"}
                  ${
                    active
                      ? "bg-white text-orange-600 shadow-lg shadow-black/10"
                      : "text-white/90 hover:bg-white/15"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex p-3 border-t border-white/20">
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-white/15 transition-colors text-white/90"
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon className="w-5 h-5" />
            {!collapsed && (
              <span className="text-xs font-bold">
                {isRtl ? "طي القائمة" : "Collapse"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

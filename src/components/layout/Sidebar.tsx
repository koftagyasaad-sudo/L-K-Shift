"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, CalendarDays, ChevronDown, Clock3, Ellipsis,
  LayoutDashboard, Shield, Users, Wallet, UserRound,
  ClipboardCheck, BriefcaseBusiness, CheckCircle2
} from "lucide-react";

interface NavItem {
  titleAr: string;
  titleEn: string;
  href: string;
  icon: typeof Clock3;
  adminOnly?: boolean;
}

const adminItems: NavItem[] = [
  { titleAr: "النظرة العامة", titleEn: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, adminOnly: true },
  { titleAr: "تسجيل الحضور", titleEn: "Check-In", href: "/attendance", icon: Clock3 },
  { titleAr: "الفروع", titleEn: "Branches", href: "/admin/branches", icon: Building2, adminOnly: true },
  { titleAr: "الموظفين", titleEn: "Employees", href: "/admin/employees", icon: Users, adminOnly: true },
  { titleAr: "الحضور والرواتب", titleEn: "Attendance & Payroll", href: "/admin/attendance-review", icon: ClipboardCheck, adminOnly: true },
  { titleAr: "الطلبات", titleEn: "Requests", href: "/requests", icon: CalendarDays },
  { titleAr: "اعتماد الطلبات", titleEn: "Approvals", href: "/admin/leave-requests", icon: CheckCircle2, adminOnly: true },
  { titleAr: "الأدوار", titleEn: "Roles", href: "/admin/roles", icon: Shield, adminOnly: true },
  { titleAr: "التوظيف", titleEn: "Recruitment", href: "/admin/recruitment", icon: BriefcaseBusiness, adminOnly: true },
];

const employeeItems: NavItem[] = [
  { titleAr: "الحضور", titleEn: "Attendance", href: "/attendance", icon: Clock3 },
  { titleAr: "ملفي الشخصي", titleEn: "Profile", href: "/profile", icon: UserRound },
  { titleAr: "الراتب", titleEn: "Salary", href: "/employee/salary", icon: Wallet },
  { titleAr: "الطلبات", titleEn: "Requests", href: "/requests", icon: CalendarDays },
];

function useNavigationRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { user?: { systemRole?: string; permissions?: unknown } }) => {
        if (!active) return;
        const perms = Array.isArray(data.user?.permissions) ? data.user.permissions.filter((p): p is string => typeof p === "string") : [];
        setIsAdmin(data.user?.systemRole !== "EMPLOYEE" && (data.user?.systemRole === "SUPER_ADMIN" || perms.length > 0));
      })
      .catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, []);
  return isAdmin;
}

function isItemActive(pathname: string, locale: string, href: string) {
  const target = "/" + locale + href;
  return pathname === target || pathname.startsWith(target + "/");
}

export function DesktopNav({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const isRtl = locale === "ar";
  const isAdmin = useNavigationRole();
  const items = isAdmin ? adminItems : employeeItems;

  return (
    <nav aria-label={isRtl ? "التنقل الرئيسي" : "Primary navigation"} className="build-top-nav hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(pathname, locale, item.href);
        return (
          <Link
            key={item.titleEn}
            href={"/" + locale + item.href}
            prefetch
            className={"build-nav-link flex items-center gap-1.5 " + (active ? "active" : "")}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{isRtl ? item.titleAr : item.titleEn}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const isRtl = locale === "ar";
  const isAdmin = useNavigationRole();
  const [showMore, setShowMore] = useState(false);

  const items = isAdmin ? adminItems.slice(0, 4) : employeeItems;
  const moreItems = isAdmin ? adminItems.slice(4) : [];

  return (
    <div className="lg:hidden">
      {showMore && <button type="button" className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs" aria-label={isRtl ? "إغلاق القائمة" : "Close menu"} onClick={() => setShowMore(false)} />}
      {showMore && moreItems.length > 0 && (
        <div className="build-mobile-drawer fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] end-3 z-40 min-w-52 p-2 shadow-2xl" dir={isRtl ? "rtl" : "ltr"}>
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, locale, item.href);
            return (
              <Link key={item.titleEn} href={"/" + locale + item.href} onClick={() => setShowMore(false)} className={"build-drawer-item flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition " + (active ? "active" : "")}>
                <Icon className="h-4 w-4" />
                <span>{isRtl ? item.titleAr : item.titleEn}</span>
              </Link>
            );
          })}
        </div>
      )}
      <nav aria-label={isRtl ? "التنقل الرئيسي" : "Primary navigation"} className={"build-mobile-bar fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] " + (moreItems.length > 0 ? "grid-cols-5" : "grid-cols-4") + " pb-[env(safe-area-inset-bottom)]"} dir={isRtl ? "rtl" : "ltr"}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, locale, item.href);
          return (
            <Link key={item.titleEn} href={"/" + locale + item.href} prefetch className={"build-mobile-tab flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors " + (active ? "active" : "")}>
              <Icon className="h-[18px] w-[18px]" />
              <span className="max-w-full truncate px-1">{isRtl ? item.titleAr : item.titleEn}</span>
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button type="button" onClick={() => setShowMore((o) => !o)} className={"build-mobile-tab flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold " + (showMore ? "active" : "")}>
            <Ellipsis className="h-[18px] w-[18px]" />
            <span>{isRtl ? "المزيد" : "More"}</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  return null;
}
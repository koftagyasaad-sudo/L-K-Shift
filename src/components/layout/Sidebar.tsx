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

const adminPrimary: NavItem[] = [
  { titleAr: "النظرة العامة", titleEn: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, adminOnly: true },
  { titleAr: "الفروع", titleEn: "Branches", href: "/admin/branches", icon: Building2, adminOnly: true },
  { titleAr: "الموظفين", titleEn: "Employees", href: "/admin/employees", icon: Users, adminOnly: true },
];

const attendanceGroup: NavItem[] = [
  { titleAr: "مراجعة الحضور", titleEn: "Attendance Review", href: "/admin/attendance-review", icon: ClipboardCheck, adminOnly: true },
  { titleAr: "الرواتب", titleEn: "Payroll", href: "/admin/attendance-review", icon: Wallet, adminOnly: true },
];

const adminTrailing: NavItem[] = [
  { titleAr: "الطلبات", titleEn: "Requests", href: "/requests", icon: CalendarDays },
  { titleAr: "الأدوار", titleEn: "Roles", href: "/admin/roles", icon: Shield, adminOnly: true },
];

const employeeItems: NavItem[] = [
  { titleAr: "الحضور", titleEn: "Attendance", href: "/attendance", icon: Clock3 },
  { titleAr: "ملفي الشخصي", titleEn: "Profile", href: "/profile", icon: UserRound },
  { titleAr: "الراتب", titleEn: "Salary", href: "/employee/salary", icon: Wallet },
  { titleAr: "الطلبات", titleEn: "Requests", href: "/requests", icon: CalendarDays },
];

const secondaryItems: NavItem[] = [
  { titleAr: "اعتماد الطلبات", titleEn: "Approvals", href: "/admin/leave-requests", icon: CheckCircle2, adminOnly: true },
  { titleAr: "التوظيف", titleEn: "Recruitment", href: "/admin/recruitment", icon: BriefcaseBusiness, adminOnly: true },
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
  const target = `/${locale}${href}`;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function DesktopNav({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const isRtl = locale === "ar";
  const isAdmin = useNavigationRole();
  const [openMenu, setOpenMenu] = useState<"attendance" | "more" | null>(null);

  if (!isAdmin) {
    return (
      <nav aria-label={isRtl ? "التنقل الرئيسي" : "Primary navigation"} className="hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
        {employeeItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, locale, item.href);
          return (
            <Link key={item.titleEn} href={`/${locale}${item.href}`} prefetch className={`flex h-full shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-bold transition-colors ${active ? "border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100" : "border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
              <Icon className="h-4 w-4" />
              <span>{isRtl ? item.titleAr : item.titleEn}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  const groupActive = attendanceGroup.some((i) => isItemActive(pathname, locale, i.href));

  return (
    <nav aria-label={isRtl ? "التنقل الرئيسي" : "Primary navigation"} className="hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
      {adminPrimary.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(pathname, locale, item.href);
        return (
          <Link key={item.titleEn} href={`/${locale}${item.href}`} prefetch onClick={() => setOpenMenu(null)} className={`flex h-full shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-bold transition-colors ${active ? "border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100" : "border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
            <Icon className="h-4 w-4" />
            <span>{isRtl ? item.titleAr : item.titleEn}</span>
          </Link>
        );
      })}

      <div className="relative flex h-full shrink-0 items-center">
        <button type="button" onClick={() => setOpenMenu((m) => (m === "attendance" ? null : "attendance"))} aria-expanded={openMenu === "attendance"} className={`flex h-full items-center gap-1.5 border-b-2 px-3 text-xs font-bold transition-colors ${groupActive || openMenu === "attendance" ? "border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100" : "border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
          <ClipboardCheck className="h-4 w-4" />
          <span>{isRtl ? "الحضور والرواتب" : "Attendance & Payroll"}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === "attendance" ? "rotate-180" : ""}`} />
        </button>
        {openMenu === "attendance" && (
          <div className="absolute start-0 top-full z-50 mt-1 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#141519]">
            {attendanceGroup.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.titleEn} href={`/${locale}${item.href}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-orange-400">
                  <Icon className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  <span>{isRtl ? item.titleAr : item.titleEn}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {adminTrailing.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(pathname, locale, item.href);
        return (
          <Link key={item.titleEn} href={`/${locale}${item.href}`} prefetch onClick={() => setOpenMenu(null)} className={`flex h-full shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-bold transition-colors ${active ? "border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100" : "border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
            <Icon className="h-4 w-4" />
            <span>{isRtl ? item.titleAr : item.titleEn}</span>
          </Link>
        );
      })}

      <div className="relative flex h-full shrink-0 items-center">
        <button type="button" onClick={() => setOpenMenu((m) => (m === "more" ? null : "more"))} aria-expanded={openMenu === "more"} className={`flex h-full items-center gap-1 border-b-2 px-3 text-xs font-bold transition-colors ${openMenu === "more" ? "border-orange-600 text-slate-950 dark:border-orange-500 dark:text-zinc-100" : "border-transparent text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-100"}`}>
          <span>{isRtl ? "المزيد" : "More"}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === "more" ? "rotate-180" : ""}`} />
        </button>
        {openMenu === "more" && (
          <div className="absolute end-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#141519]">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={`/${locale}${item.href}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-orange-400">
                  <Icon className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  <span>{isRtl ? item.titleAr : item.titleEn}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

export function MobileBottomNav({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  const isRtl = locale === "ar";
  const isAdmin = useNavigationRole();
  const [showMore, setShowMore] = useState(false);

  const mobileAdminPrimary: NavItem[] = [
    adminPrimary[0],
    adminPrimary[1],
    adminPrimary[2],
    { titleAr: "الحضور والرواتب", titleEn: "Attendance", href: "/admin/attendance-review", icon: ClipboardCheck },
  ];
  const mobileAdminMore: NavItem[] = [
    { titleAr: "الرواتب", titleEn: "Payroll", href: "/admin/attendance-review", icon: Wallet },
    ...adminTrailing,
    ...secondaryItems,
  ];

  const items = isAdmin ? mobileAdminPrimary : employeeItems;
  const moreItems = isAdmin ? mobileAdminMore : [];

  return (
    <div className="lg:hidden">
      {showMore && <button type="button" className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs" aria-label={isRtl ? "إغلاق القائمة" : "Close menu"} onClick={() => setShowMore(false)} />}
      {showMore && moreItems.length > 0 && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] end-3 z-40 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#141519]" dir={isRtl ? "rtl" : "ltr"}>
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.titleEn} href={`/${locale}${item.href}`} onClick={() => setShowMore(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-orange-400">
                <Icon className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                <span>{isRtl ? item.titleAr : item.titleEn}</span>
              </Link>
            );
          })}
        </div>
      )}
      <nav aria-label={isRtl ? "التنقل الرئيسي" : "Primary navigation"} className={`fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] ${moreItems.length > 0 ? "grid-cols-5" : "grid-cols-4"} border-t border-slate-200/90 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#11131A]/85`} dir={isRtl ? "rtl" : "ltr"}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, locale, item.href);
          return (
            <Link key={item.titleEn} href={`/${locale}${item.href}`} prefetch className={`flex min-w-0 flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-bold transition-colors ${active ? "border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-500" : "border-transparent text-slate-500 dark:text-zinc-400"}`}>
              <Icon className="h-[18px] w-[18px]" />
              <span className="max-w-full truncate px-1">{isRtl ? item.titleAr : item.titleEn}</span>
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button type="button" onClick={() => setShowMore((o) => !o)} className={`flex min-w-0 flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-bold ${showMore ? "border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-500" : "border-transparent text-slate-500 dark:text-zinc-400"}`}>
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

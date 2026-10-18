"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Building2, Users, ShieldCheck, 
  ChevronRight, ChevronLeft, Clock
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { href: "/ar", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
  { href: "/ar/admin/branches", label: "إدارة الفروع", icon: Building2 },
  { href: "/ar/admin/employees", label: "بيانات الموظفين", icon: Users },
  { href: "/ar/admin/attendance", label: "الحضور والانصراف", icon: Clock },
  { href: "/ar/admin/roles", label: "الأدوار والصلاحيات", icon: ShieldCheck },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 right-0 h-screen z-40 transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
      `}
      style={{
        background: "linear-gradient(180deg, rgba(249,115,22,0.95) 0%, rgba(236,72,153,0.9) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "-4px 0 24px rgba(249,115,22,0.15)",
        borderLeft: "1px solid rgba(255,255,255,0.15)"
      }}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/15">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-lg tracking-tight">L-K-Shift</h1>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 space-y-1 mt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/ar" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "bg-white text-orange-600 shadow-md" 
                  : "text-white/90 hover:bg-white/15"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : ""}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

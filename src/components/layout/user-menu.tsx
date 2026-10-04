// src/components/layout/user-menu.tsx
"use client";

import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

export function UserMenu({ name, role }: { name: string; role: string }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleLogout() {
    setOpen(false);
    signOut({ callbackUrl: `/${locale}/login` });
  }

  function handleSwitchUser() {
    setOpen(false);
    // تبديل المستخدم = تسجيل خروج ثم العودة لصفحة الدخول لإدخال حساب آخر
    signOut({ callbackUrl: `/${locale}/login` });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 ps-1.5 pe-3 text-foreground transition hover:bg-background-secondary"
      >
        <span className="gradient-hero flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
          {initials || "U"}
        </span>
        <ChevronDown className={`h-4 w-4 text-foreground-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute end-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/40">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <span className="mt-1 inline-block rounded-full bg-background-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-muted">
              {role.replace("_", " ")}
            </span>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={handleSwitchUser}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-foreground-muted transition hover:bg-background-secondary hover:text-foreground"
            >
              <UserCog className="h-4 w-4" />
              <span>{isAr ? "تبديل المستخدم" : "Switch user"}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-danger hover:bg-danger/10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition"
            >
              <LogOut className="h-4 w-4" />
              <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

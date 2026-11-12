"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const params = useParams();
  const isRtl = (params?.locale as string) !== "en";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span aria-hidden="true" className={`inline-flex h-9 w-[5.5rem] ${className}`} />;
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? (isRtl ? "ليلي" : "Night") : (isRtl ? "نهاري" : "Day");
  const actionLabel = isDark
    ? (isRtl ? "التبديل إلى الوضع النهاري" : "Switch to day mode")
    : (isRtl ? "التبديل إلى الوضع الليلي" : "Switch to night mode");

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-violet-950/15 bg-white px-2.5 text-xs font-bold text-[#433b5c] shadow-sm transition hover:bg-violet-50 dark:border-[#c4b2ff]/20 dark:bg-[#110e1f] dark:text-[#c9c0e8] dark:hover:bg-[#1a1530] ${className}`}
      aria-label={actionLabel}
      title={actionLabel}
      type="button"
    >
      {isDark ? <Moon className="h-4 w-4 text-[#c9c0e8]" /> : <Sun className="h-4 w-4 text-amber-500" />}
      <span>{label}</span>
    </button>
  );
}

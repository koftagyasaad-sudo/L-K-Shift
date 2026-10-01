"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[38px] w-[88px] rounded-full border border-border bg-surface" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background-secondary"
      aria-label="Toggle theme"
    >
      {isDark ? <SunMedium className="h-4 w-4 text-accent" /> : <MoonStar className="h-4 w-4 text-primary" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

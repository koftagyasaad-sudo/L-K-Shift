"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "ar" ? "EN" : "AR"}</span>
    </button>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = currentLocale === "ar" ? "en" : "ar";
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = next;
      router.push(segments.join("/") || `/${next}`);
    } else {
      router.push(`/${next}`);
    }
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
      type="button"
      aria-label="Toggle language"
    >
      <Globe className="w-3 h-3 text-orange-500" />
      {currentLocale === "ar" ? "EN" : "عربي"}
    </button>
  );
}

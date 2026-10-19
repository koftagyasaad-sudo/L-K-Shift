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
      className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
      type="button"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4" />
      {currentLocale === "ar" ? "EN" : "ع"}
    </button>
  );
}

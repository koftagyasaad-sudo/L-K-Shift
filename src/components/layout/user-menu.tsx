"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

export function UserMenu({ name, role }: { name: string; role: string }) {
  const locale = useLocale();
  const t = useTranslations("header");

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2 text-foreground">
      <div className="hidden text-right sm:block">
        <p className="text-xs text-foreground-muted">{t("signedInAs")}</p>
        <p className="text-sm font-semibold">{name}</p>
      </div>
      <span className="rounded-full bg-background-secondary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-muted">
        {role.replace("_", " ")}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-sm font-medium text-foreground transition hover:bg-border"
      >
        <LogOut className="h-4 w-4" />
        <span>{t("logout")}</span>
      </button>
    </div>
  );
}

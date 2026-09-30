"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ActionDialog({
  triggerLabel,
  title,
  children,
  className,
}: {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-[#D8261C] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/30 transition hover:bg-[#bb2319]"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className={cn("w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#171717]", className)}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

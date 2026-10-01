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
        className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              "w-full max-w-2xl rounded-[28px] border border-border bg-surface p-6 shadow-2xl",
              className,
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border p-2 text-foreground-muted transition hover:bg-background-secondary hover:text-foreground"
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

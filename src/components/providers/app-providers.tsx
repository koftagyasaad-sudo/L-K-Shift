"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

export function AppProviders({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  );
}

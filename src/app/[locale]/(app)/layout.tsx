"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalHeader } from "@/components/global-header";

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locale, setLocale] = useState("ar");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    params.then((resolved) => {
      if (mounted) setLocale(resolved.locale || "ar");
    });

    const authStatus = localStorage.getItem("isAuthenticated");
    if (mounted) setIsAuthenticated(authStatus === "true");

    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} locale={locale} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <GlobalHeader toggleSidebar={toggleSidebar} locale={locale} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}

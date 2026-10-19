"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import GlobalHeader from "@/components/layout/global-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className="transition-all duration-300"
        style={{ marginRight: collapsed ? "4rem" : "15rem" }}
      >
        <GlobalHeader />
        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

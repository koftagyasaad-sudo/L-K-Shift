"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu, Bell, Search } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRtl = locale === "ar";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        locale={locale}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-gray-200 shadow-sm shrink-0">
          {/* Left Side - Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              type="button"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 w-72">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isRtl ? "بحث..." : "Search..."}
                className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                O
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-gray-800 leading-tight">
                  Omar
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  {isRtl ? "مدير النظام" : "Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

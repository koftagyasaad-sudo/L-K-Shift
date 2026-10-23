"use client";

import { use, useEffect, useState } from "react";
import useRouter from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getEmployeesAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface EmployeeItem {
  id: string;
  name: string;
  phone: string;
  role?: string | null;
  jobTitle?: string | null;
  branchId?: string | null;
  isActive?: boolean | null;
  [key: string]: unknown;
}

interface BranchItem {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
  address?: string | null;
  isActive?: boolean | null;
  geofenceRadius?: number | null;
  [key: string]: unknown;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = use(params);
  const isAr = locale !== "en";

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [empRes, branchRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
      ]);

      if (empRes.success && Array.isArray(empRes.data)) {
        setEmployees(empRes.data as unknown as EmployeeItem[]);
      } else {
        setEmployees([]);
      }

      if (branchRes.success && Array.isArray(branchRes.data)) {
        setBranches(branchRes.data as unknown as BranchItem[]);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error(
        isAr ? "حدث خطأ أثناء تحميل بيانات لوحة التحكم" : "Error loading dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeEmployeesCount = employees.filter((e) => e.isActive ?? true).length;
  const activeBranchesCount = branches.filter((b) => b.isActive ?? true).length;

  return (
    <div className="container mx-auto px-4 py-8" dir={isAr ? "rtl" : "ltr"}>
      {/* Welcome Banner */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-sky-700 to-indigo-800 p-6 text-white shadow-lg md:p-8">
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {isAr ? "نظام L-K-Shift لإدارة الحضور والشيفتات" : "L-K-Shift Management System"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-sky-100 md:text-base">
          {isAr
            ? "مرحباً بك في لوحة التحكم المركزية. يمكن للمدير إدارة الموظفين، الفروع، وبصمة الحضور عبر البصمة والـ GPS."
            : "Welcome to the central admin panel. Manage employees, branches, and attendance terminal with GPS geofencing."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/attendance`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-sky-900 shadow transition hover:bg-sky-50"
          >
            📸 {isAr ? "شاشة الحضور والبصمة" : "Attendance Terminal"}
          </Link>
          <Link
            href={`/${locale}/admin/employees/new`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            ➕ {isAr ? "إضافة موظف جديد" : "Add New Employee"}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? "إجمالي الموظفين" : "Total Employees"}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-lg text-sky-600">
              👥
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {isLoading ? "..." : employees.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr
              ? `${activeEmployeesCount} موظف نشط في النظام`
              : `${activeEmployeesCount} active employees`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? "الفروع الفعالة" : "Active Branches"}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
              🏢
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {isLoading ? "..." : branches.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr
              ? `${activeBranchesCount} فرع مجهز بالنطاق الجغرافي`
              : `${activeBranchesCount} geofenced branches`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? "تسجيلات اليوم" : "Today Check-ins"}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
              📍
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {isLoading ? "..." : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? "التحقق التلقائي عبر الـ GPS" : "Auto-verified via GPS"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? "نوع تسجيل الدخول" : "Auth System"}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
              🔒
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-900">
            {isAr ? "مؤسسي (Phone ID)" : "Enterprise Phone ID"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAr ? "كلمة سر افتراضية: 123456" : "Default Password: 123456"}
          </p>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick Employees List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {isAr ? "أحدث الموظفين المضافين" : "Recent Employees"}
            </h2>
            <Link
              href={`/${locale}/admin/employees`}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              {isAr ? "عرض الكل ←" : "View All →"}
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : employees.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {isAr ? "لا يوجد موظفون حتى الآن." : "No employees registered yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {employees.slice(0, 5).map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-xs font-bold text-white">
                      {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{emp.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      emp.isActive ?? true
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {emp.isActive ?? true
                      ? isAr ? "نشط" : "Active"
                      : isAr ? "معطل" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Branches List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {isAr ? "الفروع والنطاق الجغرافي" : "Branches & Geofencing"}
            </h2>
            <Link
              href={`/${locale}/admin/branches`}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              {isAr ? "عرض الكل ←" : "View All →"}
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : branches.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {isAr ? "لا توجد فروع مسجلة حتى الآن." : "No branches registered yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {branches.slice(0, 5).map((b) => {
                const bName = isAr
                  ? String(b.nameAr || b.name || b.nameEn || "")
                  : String(b.nameEn || b.name || b.nameAr || "");

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{bName}</p>
                      {b.address ? (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {String(b.address)}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800">
                      {Number(b.geofenceRadius || 100)}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

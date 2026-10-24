'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getEmployeesAction, 
  type EmployeeData 
} from '@/actions/employeeActions';
import { 
  getBranchesAction, 
  type BranchData 
} from '@/actions/branchActions';
import { 
  Users, 
  Building2, 
  Clock, 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  MapPin 
} from 'lucide-react';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, branchRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
      ]);

      if (Array.isArray(empRes)) {
        setEmployees(empRes);
      } else {
        setEmployees([]);
      }

      if (Array.isArray(branchRes)) {
        setBranches(branchRes);
      } else {
        setBranches([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError('حدث خطأ أثناء تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeEmployees = employees.filter((e) => e.isActive);
  const activeBranches = branches.filter((b) => b.isActive);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              نظام إدارة الحضور والشيفتات (L-K Shift)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
              مرحباً بك في لوحة التحكم المركزية لادارة الفروع والموظفين وسجلات الحضور
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all text-sm"
            >
              <Clock className="w-4 h-4" />
              جهاز الحضور والانصراف
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center justify-between text-red-700 dark:text-red-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadDashboardData()}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 text-red-800 dark:text-red-200 rounded-lg text-xs font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Active Employees */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  الموظفون النشطون
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {loading ? '...' : activeEmployees.length}
                  <span className="text-sm font-normal text-slate-400 mr-2">
                    / {loading ? '...' : employees.length} إجمالي
                  </span>
                </h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <UserCheck className="w-4 h-4 text-emerald-500 ml-1" />
              <span>{employees.length - activeEmployees.length} غير نشط</span>
            </div>
          </div>

          {/* Stat 2: Active Branches */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  الفروع المتاحة
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {loading ? '...' : activeBranches.length}
                  <span className="text-sm font-normal text-slate-400 mr-2">
                    / {loading ? '...' : branches.length} إجمالي
                  </span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-emerald-500 ml-1" />
              <span>نطاق جغرافي مفعّل (GPS)</span>
            </div>
          </div>

          {/* Stat 3: Security & Verification */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  تحقق الحضور
                </p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  كاميرا + GPS
                </h3>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
              <span>التحقق الحي بصورة Selfie والنطاق</span>
            </div>
          </div>

          {/* Stat 4: Fast Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                إجراءات سريعة
              </p>
              <h3 className="text-lg font-bold mt-1">
                تسجيل الحضور الآن
              </h3>
            </div>
            <Link
              href="/attendance"
              className="mt-4 inline-flex items-center justify-between px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-white/20"
            >
              <span>فتح شاشة الحضور</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/admin/employees"
            className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
              إدارة الموظفين
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إضافة وتعديل بيانات الموظفين، تعيين الفروع، والأدوار
            </p>
          </Link>

          <Link
            href="/admin/branches"
            className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
              إدارة الفروع
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إضافة وتعديل الفروع واستخراج الإحداثيات من خرائط جوجل
            </p>
          </Link>

          <Link
            href="/admin/roles"
            className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:-translate-x-1 transition-all" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
              الأدوار والصلاحيات
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تحديد صلاحيات الوصول والمسؤوليات لكل مسمى وظيفي
            </p>
          </Link>
        </div>

        {/* Recent Data Overview Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Employees Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">أحدث الموظفين المسجلين</h3>
              </div>
              <Link
                href="/admin/employees"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                عرض الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">جاري تحميل الموظفين...</div>
              ) : employees.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">لا يوجد موظفون مسجلون حالياً</div>
              ) : (
                employees.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {emp.fullNameAr || emp.name || emp.phone}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                        {emp.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {emp.role || 'موظف'}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Branches Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">فروع الشركة</h3>
              </div>
              <Link
                href="/admin/branches"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                عرض الكل <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">جاري تحميل الفروع...</div>
              ) : branches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">لا توجد فروع مسجلة حالياً</div>
              ) : (
                branches.slice(0, 5).map((branch) => (
                  <div key={branch.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {branch.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {branch.address || 'لا يوجد عنوان محدد'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        نطاق: {branch.geofenceRadius || branch.radiusMeters || 100}م
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, branches, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { 
  User, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  BadgeCheck,
  Mail,
  FileText
} from 'lucide-react';

export default async function EmployeeProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  const userRecords = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      fullNameAr: users.fullNameAr,
      fullNameEn: users.fullNameEn,
      email: users.email,
      role: users.role,
      jobTitle: users.jobTitle,
      employeeCode: users.employeeCode,
      hourlyRate: users.hourlyRate,
      monthlySalary: users.monthlySalary,
      notes: users.notes,
      isActive: users.isActive,
      createdAt: users.createdAt,
      branchName: branches.name,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(branches, eq(users.branchId, branches.id))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  const profile = userRecords[0];

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center" dir="rtl">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <p className="text-slate-600 dark:text-slate-300 font-medium">لم يتم العثور على بيانات الملف الشخصي.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl font-bold border-2 border-blue-500/20">
            {(profile.fullNameAr || profile.name || profile.phone).charAt(0)}
          </div>
          <div className="text-center md:text-right space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl font-bold">
                {profile.fullNameAr || profile.name || 'موظف'}
              </h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${profile.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800'}`}>
                {profile.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {profile.jobTitle || profile.roleName || 'كادر وظيفي'}
            </p>
            {profile.employeeCode && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                كود الموظف: {profile.employeeCode}
              </p>
            )}
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              البيانات الأساسية
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> رقم الهاتف (مُعرف الدخول)
                </span>
                <span className="font-semibold font-mono" dir="ltr">{profile.phone}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> البريد الإلكتروني
                </span>
                <span className="font-medium">{profile.email || 'غير مسجل'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> الفرع التابع له
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {profile.branchName || 'غير معين لموقع'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> الدور والصلاحية
                </span>
                <span className="font-semibold">
                  {profile.roleName || profile.role || 'موظف'}
                </span>
              </div>
            </div>
          </div>

          {/* Job & Financial Info */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-500" />
              البيانات الوظيفية
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" /> المسمى الوظيفي
                </span>
                <span className="font-medium">{profile.jobTitle || 'غير محدد'}</span>
              </div>

              {profile.monthlySalary !== null && profile.monthlySalary !== undefined && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> الراتب الشهرى
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.monthlySalary} ج.م
                  </span>
                </div>
              )}

              {profile.hourlyRate !== null && profile.hourlyRate !== undefined && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> أجر الساعة
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {profile.hourlyRate} ج.م
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> تاريخ التسجيل
                </span>
                <span className="font-medium">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section if exists */}
        {profile.notes && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> ملاحظات إدارية
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {profile.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

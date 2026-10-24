import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, branches, attendanceLogs } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { 
  Banknote, 
  CreditCard, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default async function EmployeeSalaryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // جلب بيانات الموظف المالية مع الفرع
  const userRecords = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      fullNameAr: users.fullNameAr,
      jobTitle: users.jobTitle,
      hourlyRate: users.hourlyRate,
      monthlySalary: users.monthlySalary,
      employeeCode: users.employeeCode,
      branchId: users.branchId,
      branchName: branches.name,
      branchNameAr: branches.nameAr,
      branchNameEn: branches.nameEn,
    })
    .from(users)
    .leftJoin(branches, eq(users.branchId, branches.id))
    .where(eq(users.id, userId))
    .limit(1);

  const employee = userRecords[0];

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center" dir="rtl">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <p className="text-slate-600 dark:text-slate-300 font-medium">لم يتم العثور على البيانات المالية للموظف.</p>
        </div>
      </div>
    );
  }

  // حساب الحضور للشهر الحالي
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyLogs = await db
    .select()
    .from(attendanceLogs)
    .where(
      and(
        eq(attendanceLogs.userId, userId),
        gte(attendanceLogs.timestamp, startOfMonth),
        lte(attendanceLogs.timestamp, endOfMonth)
      )
    )
    .orderBy(desc(attendanceLogs.timestamp));

  const checkIns = monthlyLogs.filter((l) => l.type === 'CHECK_IN');
  const checkOuts = monthlyLogs.filter((l) => l.type === 'CHECK_OUT');

  // حساب تقديري لأيام وساعات العمل
  const totalDaysPresent = checkIns.length;
  const estimatedHours = totalDaysPresent * 8; // افتراض متوسط 8 ساعات عمل لكل تسجيل حضور

  const hourlyRate = employee.hourlyRate || 0;
  const monthlySalary = employee.monthlySalary || 0;
  const estimatedEarnings = monthlySalary > 0 
    ? monthlySalary 
    : (estimatedHours * hourlyRate);

  const monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const currentMonthName = monthNamesArabic[now.getMonth()];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Banknote className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              تفاصيل الراتب والمستحقات المالية
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              تقرير الراتب التقديري وسجل الساعات لشهر {currentMonthName} {now.getFullYear()}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-medium">الراتب المتوقع هذا الشهر</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {estimatedEarnings.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">الراتب الأساسي الشهري</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {monthlySalary > 0 ? `${monthlySalary.toLocaleString('ar-EG')} ج.م` : 'غير محدد'}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">أجر الساعة المحسوب</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {hourlyRate > 0 ? `${hourlyRate.toLocaleString('ar-EG')} ج.م` : 'غير محدد'}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">أيام الحضور المسجلة</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalDaysPresent} يوم
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Employee & Branch Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            معلومات الموظف والفرع
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400">اسم الموظف:</span>
              <span className="font-semibold">{employee.fullNameAr || employee.name}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400">رقم الهاتف:</span>
              <span className="font-semibold font-mono" dir="ltr">{employee.phone}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400">المسمى الوظيفي:</span>
              <span className="font-semibold">{employee.jobTitle || 'غير محدد'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" /> الفرع المعين:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {employee.branchNameAr || employee.branchName || employee.branchNameEn || 'غير محدد'}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Log Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              سجل الحضور والانصراف للشهر الحالي
            </h3>
            <span className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full font-medium">
              إجمالي التسجيلات: {monthlyLogs.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 overflow-x-auto">
            {monthlyLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                لا توجد سجلات حضور مسجلة لهذا الشهر حتى الآن.
              </div>
            ) : (
              monthlyLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${log.type === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}`}>
                      {log.type === 'CHECK_IN' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {log.type === 'CHECK_IN' ? 'تسجيل حضور' : 'تسجيل انصراف'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold font-mono bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {log.isWithinGeofence ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-block">
                        داخل الفرع
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60 hidden sm:inline-block">
                        خارج الفرع
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

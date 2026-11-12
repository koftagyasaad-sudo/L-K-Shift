import React from 'react';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import EmployeeForm from '../../employee-form';
import { getSqlRows } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewEmployeePage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  let branchesList: Array<{ id: string; nameAr: string; nameEn: string; name: string }> = [];
  let rolesList: Array<{ id: number; name: string; nameAr: string }> = [];

  // 1. جلب الفروع المسجلة مباشرة من قاعدة البيانات
  try {
    const bRaw = await db.execute(sql`
      SELECT id, name_ar as "nameAr", name_en as "nameEn", name_ar as name
      FROM branches
      WHERE is_active = true
      ORDER BY id ASC;
    `);
    branchesList = getSqlRows<typeof branchesList[number]>(bRaw);
  } catch (error) {
    console.error('Failed to load branches for new employee page:', error);
  }

  // 2. جلب الأدوار المسجلة مباشرة من جدول custom_roles
  try {
    const rRaw = await db.execute(sql`
      SELECT id, name, name_ar as "nameAr"
      FROM custom_roles
      ORDER BY id ASC;
    `);
    rolesList = getSqlRows<typeof rolesList[number]>(rRaw);
  } catch (error) {
    console.error('Failed to load roles for new employee page:', error);
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {isRtl ? 'إضافة موظف جديد' : 'Add New Employee'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isRtl
            ? 'أدخل بيانات الموظف برقم التليفون (اسم المستخدم) وكلمة المرور والفرع المسند'
            : 'Enter employee phone (username), password, and assigned branch'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#121526] dark:shadow-xl sm:p-8">
        <EmployeeForm
          branches={branchesList}
          roles={rolesList}
          locale={locale}
        />
      </div>
    </div>
  );
}

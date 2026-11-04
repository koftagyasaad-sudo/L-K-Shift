import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminRolesPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  let rolesList: any[] = [];

  // جلب مباشر ومحصن للأدوار من جدول custom_roles
  try {
    const raw = await db.execute(sql`
      SELECT 
        id, 
        name, 
        name_ar as "nameAr", 
        permissions, 
        is_system as "isSystem",
        created_at as "createdAt"
      FROM custom_roles 
      ORDER BY id ASC;
    `);

    rolesList = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
  } catch (error) {
    console.error('Failed to load roles from DB:', error);
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة مع زر إضافة دور */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isRtl ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'إدارة الرتب الوظيفية وصلاحيات الوصول لكافة أقسام النظام'
              : 'Configure system roles, access levels, and security permissions'}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/roles/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 focus:outline-none"
        >
          {isRtl ? '+ إضافة دور مخصص' : '+ Add Custom Role'}
        </Link>
      </div>

      {/* جدول الأدوار والصلاحيات */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 dark:shadow-xl dark:backdrop-blur-md">
        {rolesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-base font-medium">
              {isRtl ? 'لا توجد أدوار مسجلة حالياً' : 'No roles registered yet'}
            </p>
            <Link
              href={`/${locale}/admin/roles/new`}
              className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline dark:text-orange-400"
            >
              {isRtl ? 'إنشاء دور جديد الآن' : 'Create first role'} &larr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'اسم الدور' : 'Role Name'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'المعرف البرمجي' : 'Code'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الصلاحيات الممنوحة' : 'Permissions'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'النوع' : 'Type'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rolesList.map((role: any) => {
                  let perms: string[] = [];
                  if (Array.isArray(role.permissions)) {
                    perms = role.permissions;
                  } else if (typeof role.permissions === 'object' && role.permissions !== null) {
                    perms = Object.keys(role.permissions);
                  }

                  return (
                    <tr key={role.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {role.nameAr || role.name_ar || role.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {role.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {perms.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            perms.slice(0, 4).map((p: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/5 dark:text-slate-300"
                              >
                                {p}
                              </span>
                            ))
                          )}
                          {perms.length > 4 && (
                            <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                              +{perms.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            role.isSystem ?? role.is_system
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          }`}
                        >
                          {role.isSystem ?? role.is_system ? (isRtl ? 'نظامي أساسي' : 'System') : (isRtl ? 'مخصص' : 'Custom')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {role.isSystem ?? role.is_system ? (
                          <span className="text-xs font-medium text-slate-400">{isRtl ? 'محمي' : 'Locked'}</span>
                        ) : (
                          <Link
                            href={`/${locale}/admin/roles/${role.id}`}
                            className="text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
                          >
                            {isRtl ? 'تعديل' : 'Edit'}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

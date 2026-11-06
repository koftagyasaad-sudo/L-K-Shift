'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import EmployeeFormComponent from '@/components/admin/employee-form';

interface EmployeeItem {
  id: number;
  name?: string;
  fullName?: string;
  phone: string;
  role: string;
  employeeCode?: string;
  branchId?: number;
  branchName?: string;
  basicSalary?: number;
  workingHoursPerDay?: number;
  annualLeaveDays?: number;
  isActive: boolean;
  createdAt?: string;
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AdminEmployeesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // نافذة التعديل وتحديد الدور
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [empRes, rolesRes, branchRes] = await Promise.all([
        fetch('/api/employees', { cache: 'no-store' }),
        fetch('/api/roles', { cache: 'no-store' }),
        fetch('/api/branches', { cache: 'no-store' }),
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (rolesRes.ok) setRolesList(await rolesRes.json());
      if (branchRes.ok) setBranchesList(await branchRes.json());
    } catch (err) {
      console.error('Failed to load employees data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (empId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/employees?id=${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const empName = (emp.fullName || emp.name || '').toLowerCase();
    const empPhone = (emp.phone || '').toLowerCase();
    const empCode = (emp.employeeCode || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = empName.includes(query) || empPhone.includes(query) || empCode.includes(query);
    const matchesBranch = selectedBranch === 'ALL' || String(emp.branchId) === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            إدارة الموظفين والكوادر
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            تعديل بيانات الموظفين، إسناد الفروع، وتعيين الأدوار والصلاحيات الوظيفية
          </p>
        </div>

        <Link
          href={`/${locale}/admin/employees/new`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
        >
          + إضافة موظف جديد
        </Link>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#121526]/80 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، رقم التليفون، أو الكود الوظيفي..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/30 px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/30 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">جميع الفروع</option>
            {branchesList.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.nameAr || b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#121526]/80">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            لا يوجد موظفين مطابقين للبحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm dark:divide-white/5" dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300 text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">الموظف والكود</th>
                  <th className="px-6 py-4 font-semibold">رقم الهاتف</th>
                  <th className="px-6 py-4 font-semibold">الفرع</th>
                  <th className="px-6 py-4 font-semibold">الدور والصلاحية</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div>{emp.fullName || emp.name}</div>
                      <div className="text-[11px] font-mono font-normal text-orange-500">
                        {emp.employeeCode ? `#${emp.employeeCode}` : 'بدون كود'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      {emp.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {emp.branchName || 'غير مسند لفرع'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-orange-500/10 px-2.5 py-1 font-bold text-orange-600">
                        {emp.role || 'موظف'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(emp.id, emp.isActive)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer transition ${
                          emp.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                        }`}
                      >
                        {emp.isActive ? '✓ نشط' : '✕ موقف'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleEditClick(emp)}
                        className="rounded-xl border border-slate-300 bg-white dark:bg-white/5 dark:border-white/10 px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
                      >
                        ✏️ تعديل وتحديد الدور
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة التعديل المنبثقة (Modal) مع الأدوار المحدثة */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-white/10 dark:bg-[#121526] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تعديل بيانات وصلاحيات: {editingEmployee.fullName || editingEmployee.name}
                </h3>
                <p className="text-[11px] text-slate-400">تحديث الدور الوظيفي، الفرع، وساعات العمل</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <EmployeeFormComponent
              initialData={editingEmployee}
              branches={branchesList}
              roles={rolesList}
              locale={locale}
              onCancel={() => setShowEditModal(false)}
              onSuccess={async () => {
                setShowEditModal(false);
                await loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getEmployeesAction, 
  deleteEmployeeAction, 
  toggleEmployeeStatusAction, 
  type EmployeeData 
} from '@/actions/employeeActions';
import { getBranchesAction, type BranchData } from '@/actions/branchActions';
import { getRolesAction, type RoleData } from '@/actions/roleActions';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit, 
  Power,
  AlertCircle,
  X
} from 'lucide-react';

export default function EmployeesAdminPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // UI Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, branchRes, roleRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
        getRolesAction(),
      ]);

      setEmployees(Array.isArray(empRes) ? empRes : []);
      setBranches(Array.isArray(branchRes) ? branchRes : []);
      setRoles(Array.isArray(roleRes) ? roleRes : []);
    } catch (err) {
      console.error('Failed to load employees page data:', err);
      showToast('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (id: string, currentStatus?: boolean) => {
    try {
      const statusToToggle = currentStatus !== undefined ? currentStatus : true;
      const res = await toggleEmployeeStatusAction(id, statusToToggle);
      if (res && (res.success || !res.error)) {
        showToast('تم تحديث حالة الموظف بنجاح', 'success');
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? { ...emp, isActive: !statusToToggle } : emp))
        );
      } else {
        showToast(res?.error || 'فشل تحديث حالة الموظف', 'error');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast('حدث خطأ أثناء تغيير حالة الموظف', 'error');
    }
  };

  const handleDelete = async (id: string, name?: string | null) => {
    if (!confirm(`هل أنت تأكد من رغبتك في حذف الموظف "${name || 'المحدد'}"؟`)) {
      return;
    }

    try {
      const res = await deleteEmployeeAction(id);
      if (res && (res.success || !res.error)) {
        showToast('تم حذف الموظف بنجاح', 'success');
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      } else {
        showToast(res?.error || 'فشل حذف الموظف', 'error');
      }
    } catch (err) {
      console.error('Failed to delete employee:', err);
      showToast('حدث خطأ أثناء عملية الحذف', 'error');
    }
  };

  // Export to CSV with UTF-8 BOM for Arabic language support
  const exportToCSV = () => {
    if (filteredEmployees.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    const headers = ['المعرف', 'اسم الموظف', 'رقم الهاتف (اسم المستخدم)', 'الوظيفة', 'الفرع', 'الدور', 'الحالة', 'تاريخ الإنشاء'];
    const rows = filteredEmployees.map((emp) => [
      emp.id,
      `"${emp.fullNameAr || emp.name || ''}"`,
      `"${emp.phone || ''}"`,
      `"${emp.jobTitle || ''}"`,
      `"${branches.find((b) => b.id === emp.branchId)?.name || 'غير محدد'}"`,
      `"${emp.role || 'موظف'}"`,
      emp.isActive ? 'نشط' : 'غير نشط',
      emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('ar-EG') : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.fullNameAr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone || '').includes(searchQuery) ||
      (emp.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === 'ALL' || emp.branchId === selectedBranch;
    const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole || emp.roleId === selectedRole;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && emp.isActive) ||
      (selectedStatus === 'INACTIVE' && !emp.isActive);

    return matchesSearch && matchesBranch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner Toast Notification */}
        {toast && (
          <div className={`p-4 rounded-xl shadow-md flex items-center justify-between text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium text-sm">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              إدارة الموظفين
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              إضافة، تعديل، والتحكم في حسابات الموظفين وصلاحيات الفروع
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              تصدير CSV
            </button>

            <Link
              href="/admin/employees/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              إضافة موظف جديد
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="ALL">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="ALL">جميع الأدوار</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.nameAr || r.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">النشطون فقط</option>
              <option value="INACTIVE">غير النشطين فقط</option>
            </select>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">رقم الهاتف (مُعرف الدخول)</th>
                  <th className="p-4">المسمى الوظيفي</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      جاري تحميل الموظفين...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا يوجد موظفون يطابقون خيارات البحث.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const branch = branches.find((b) => b.id === emp.branchId);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                              {(emp.fullNameAr || emp.name || emp.phone).charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {emp.fullNameAr || emp.name || 'بدون اسم'}
                              </p>
                              {emp.email && (
                                <p className="text-xs text-slate-400">{emp.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                          {emp.phone}
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {emp.jobTitle || emp.role || 'موظف'}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {branch ? branch.name : 'غير محدد'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${emp.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                            {emp.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {emp.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(emp.id, emp.isActive)}
                              title={emp.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                              className={`p-1.5 rounded-lg transition-colors ${emp.isActive ? 'hover:bg-amber-50 text-amber-600 dark:hover:bg-amber-950' : 'hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950'}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <Link
                              href={`/admin/employees/${emp.id}/edit`}
                              title="تعديل الموظف"
                              className="p-1.5 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-950 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleDelete(emp.id, emp.fullNameAr || emp.name)}
                              title="حذف الموظف"
                              className="p-1.5 hover:bg-red-50 text-red-600 dark:hover:bg-red-950 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PaginationControls, usePaginatedItems } from '@/components/ui/PaginationControls';
import {
  Users,
  Search,
  FileText,
  UserCheck,
  Edit2,
  Printer,
  X,
  Loader2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Timer,
  Hash,
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  phoneAlt: string;
  nationalId: string;
  nationalIdExpiry: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  militaryStatus: string;
  address: string;
  socialInsuranceNo: string;
  drivingLicense: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyContact: string;
  payoutMethod: string;
  payoutAccount: string;
  bankName: string;
  educationLevel: string;
  educationField: string;
  graduationYear: number;
  avatarUrl: string;
  role: string;
  systemRole: string;
  employeeCode: string;
  monthlySalary: number;
  workingHoursPerDay: number;
  workingDaysPerMonth: number;
  isActive: boolean;
  branchId: string | null;
  branchName: string;
  hireDate: string;
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

interface BranchOption {
  id: string;
  name: string;
  nameAr: string;
}

interface ZkAttendanceRecord {
  id: string | number;
  workDate: string;
  checkInTime: string | Date | null;
  checkOutTime: string | Date | null;
  gpsDistance: number;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: string;
}

async function readApiList<T>(response: Response, property: string): Promise<T[]> {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      && typeof payload.message === 'string'
      ? payload.message
      : 'تعذر تحميل البيانات.';
    throw new Error(message);
  }
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record[property])) return record[property] as T[];
    if (Array.isArray(record.data)) return record.data as T[];
  }
  throw new Error('استجابة الخادم غير صالحة.');
}

// دالة ذكية تقرأ أي صيغة وقت صادرة من قاعدة البيانات أو ماكينة البصمة وتمنع ظهور الشرطة
function formatTimeArabic(val: string | number | Date | null | undefined): string {
  if (!val) return '—';

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes('ص') || trimmed.includes('م')) return trimmed;

    // فحص إذا كان الوقت بصيغة HH:mm:ss أو HH:mm
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(\s*(AM|PM|am|pm))?$/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const ampm = timeMatch[4]?.toUpperCase()?.trim();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const period = h >= 12 ? 'م' : 'ص';
      const displayH = h % 12 || 12;
      return `${displayH}:${m} ${period}`;
    }
  }

  try {
    let d = new Date(val);
    if (isNaN(d.getTime()) && typeof val === 'string') {
      d = new Date(`2000-01-01T${val}`);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch {}

  return typeof val === 'string' ? val : '—';
}

export default function EmployeesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [allBranches, setAllBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [branchFilter, setBranchFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [systemRoles, setSystemRoles] = useState<string[]>([
    'مدير النظام',
    'مدير عام',
    'مدير فرع',
    'مدير منطقة',
    'مشرف وردية',
    'كول سنتر',
    'كاشير',
    'عضو مطبخ',
    'شيف / طاهي',
    'كابتن صالة وويتر',
    'دليفري / طيار',
    'مسؤول موارد بشرية',
    'عامل نظافة وخدمات',
    'موظف',
  ]);

  const [selectedHrEmployee, setSelectedHrEmployee] = useState<EmployeeItem | null>(null);
  const [selectedZkEmployee, setSelectedZkEmployee] = useState<EmployeeItem | null>(null);
  const [zkRecords, setZkRecords] = useState<ZkAttendanceRecord[]>([]);
  const [zkLoading, setZkLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<EmployeeItem>>({});
  const [savingEmp, setSavingEmp] = useState(false);
  const [modalStatusMsg, setModalStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      const resE = await fetch('/api/employees', { cache: 'no-store' });
      setEmployees(await readApiList<EmployeeItem>(resE, 'employees'));

      const resB = await fetch('/api/branches', { cache: 'no-store' });
      const dataB = await readApiList<{
        id: string;
        name?: string;
        nameAr?: string;
        name_ar?: string;
      }>(resB, 'branches');
      const mappedB: BranchOption[] = dataB.map((b) => ({
        id: b.id,
        name: b.name || 'Branch',
        nameAr: b.nameAr || b.name_ar || b.name || 'فرع',
      }));
      setAllBranches(mappedB);

      const resR = await fetch('/api/roles', { cache: 'no-store' });
      if (resR.ok) {
        const dataR = await resR.json();
        if (Array.isArray(dataR) && dataR.length > 0) {
          const names = dataR
            .map((r: { nameAr?: string; name?: string }) => r.nameAr || r.name)
            .filter((name: string | undefined): name is string => Boolean(name));
          setSystemRoles((prev) => Array.from(new Set([...prev, ...names])));
        }
      }
    } catch (err) {
      console.error('Failed to load employees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const handleOpenZkSheet = async (emp: EmployeeItem) => {
    setSelectedZkEmployee(emp);
    setZkLoading(true);
    try {
      const res = await fetch(
        `/api/attendance?userId=${emp.id}&code=${emp.employeeCode}&phone=${emp.phone}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setZkRecords(Array.isArray(data) ? data : []);
      }
    } catch {
      setZkRecords([]);
    } finally {
      setZkLoading(false);
    }
  };

  const handleOpenEditModal = (emp?: EmployeeItem) => {
    setModalStatusMsg(null);
    if (emp) {
      setEditingEmp({
        id: emp.id,
        fullNameAr: emp.fullNameAr,
        phone: emp.phone,
        employeeCode: emp.employeeCode || '',
        role: emp.role || 'عضو مطبخ',
        branchId: emp.branchId || allBranches[0]?.id || '',
        monthlySalary: emp.monthlySalary || 5000,
        workingHoursPerDay: emp.workingHoursPerDay || 8,
        isActive: emp.isActive !== false,
        shiftName: emp.shiftName || 'الشيفت الصباحي',
        shiftStartTime: emp.shiftStartTime || '10:00',
        shiftEndTime: emp.shiftEndTime || '18:00',
      });
    } else {
      setEditingEmp({
        id: undefined,
        fullNameAr: '',
        phone: '',
        employeeCode: '',
        role: 'عضو مطبخ',
        branchId: allBranches[0]?.id || '',
        monthlySalary: 5000,
        workingHoursPerDay: 8,
        isActive: true,
        shiftName: 'الشيفت الصباحي',
        shiftStartTime: '10:00',
        shiftEndTime: '18:00',
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmp(true);
    setModalStatusMsg(null);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEmp),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حفظ بيانات الموظف والمسلسل');

      setModalStatusMsg({ type: 'ok', text: 'تم حفظ وتحديث بيانات الموظف بنجاح!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
        fetchEmployeesData();
      }, 700);
    } catch (err: unknown) {
      setModalStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSavingEmp(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchBranch = branchFilter === 'ALL' || String(emp.branchId) === branchFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      emp.fullNameAr.toLowerCase().includes(q) ||
      emp.phone.includes(q) ||
      emp.employeeCode.includes(q);
    return matchBranch && matchSearch;
  });
  const employeePage = usePaginatedItems(filteredEmployees, `${branchFilter}|${searchTerm}`);
  const zkPage = usePaginatedItems(zkRecords, selectedZkEmployee?.id || '');

  return (
    <div className="space-y-6 pb-16 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-slate-100 border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة شؤون الموظفين والورديات</h1>
            <p className="text-xs text-slate-500 mt-1">
              مسلسل تلقائي للموظفين (001)، اختيار الأدوار من السيستم، وتفريغ شيتات ZK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenEditModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>إضافة موظف جديد</span>
          </button>

          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700">
            إجمالي الموظفين: {employees.length}
          </div>
        </div>
      </div>

      {/* البحث وفلتر الفروع */}
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="w-full sm:w-60">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">جميع الفروع</option>
            {allBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، رقم التليفون، أو المسلسل الوظيفي..."
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs pl-8 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {/* جدول الموظفين */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-slate-100 border border-slate-200 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500">جاري تحميل بيانات الموظفين...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">الموظف والمسلسل</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4">وردية الشيفت المحددة</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات والتقارير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employeePage.pageItems.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{emp.fullNameAr}</div>
                      <div className="text-[11px] font-mono text-orange-600 font-bold">#{emp.employeeCode}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{emp.phone}</td>
                    <td className="p-4 font-semibold text-slate-800">{emp.branchName}</td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[11px]">
                        <Timer size={12} />
                        <span>{emp.shiftStartTime || '10:00'} - {emp.shiftEndTime || '18:00'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ✓ نشط
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer"
                          title="تعديل بيانات الموظف والمسلسل"
                        >
                          <Edit2 size={13} />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenZkSheet(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition cursor-pointer"
                          title="عرض وتفريغ شيت بصمات ZK للموظف"
                        >
                          <FileText size={13} />
                          <span>شيت ZK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedHrEmployee(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                          title="عرض وطباعة الاستمارة الرسمية للموارد البشرية"
                        >
                          <UserCheck size={13} />
                          <span>ملف HR</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={employeePage.page}
            pageCount={employeePage.pageCount}
            itemCount={filteredEmployees.length}
            onPageChange={employeePage.setPage}
            isRtl={isRtl}
          />
        </div>
      )}

      {/* مودال تعديل الموظف */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 size={18} className="text-orange-500" />
                <span>{editingEmp.id ? `تعديل بيانات الموظف (#${editingEmp.employeeCode || ''})` : 'إضافة موظف جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {modalStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  modalStatusMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {modalStatusMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{modalStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Hash size={13} className="text-orange-500" />
                    <span>المسلسل / كود الموظف (001)</span>
                  </label>
                  <input
                    type="text"
                    value={editingEmp.employeeCode || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, employeeCode: e.target.value })}
                    placeholder="مثال: 001"
                    className="w-full bg-slate-50 border border-slate-300 text-orange-600 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل (رباعي) *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.fullNameAr || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fullNameAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اسم الدخول) *</label>
                  <input
                    type="tel"
                    required
                    value={editingEmp.phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فرع العمل *</label>
                  <select
                    value={editingEmp.branchId || allBranches[0]?.id || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, branchId: e.target.value || null })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الدور الوظيفي (اختيار من أدوار السيستم) *
                  </label>
                  <select
                    value={editingEmp.role || 'عضو مطبخ'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {systemRoles.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-orange-700">
                  <Timer size={16} />
                  <span>تحديد مواعيد وردية الشيفت الخاصة بهذا الموظف:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">بداية الشيفت (ساعة الحضور):</label>
                    <input
                      type="time"
                      value={editingEmp.shiftStartTime || '10:00'}
                      onChange={(e) => setEditingEmp({ ...editingEmp, shiftStartTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">نهاية الشيفت (ساعة الانصراف):</label>
                    <input
                      type="time"
                      value={editingEmp.shiftEndTime || '18:00'}
                      onChange={(e) => setEditingEmp({ ...editingEmp, shiftEndTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الشهري (جنيه)</label>
                  <input
                    type="number"
                    value={editingEmp.monthlySalary || 5000}
                    onChange={(e) => setEditingEmp({ ...editingEmp, monthlySalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ساعات العمل اليومية</label>
                  <input
                    type="number"
                    value={editingEmp.workingHoursPerDay || 8}
                    onChange={(e) => setEditingEmp({ ...editingEmp, workingHoursPerDay: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEmp}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {savingEmp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>حفظ البيانات والمسلسل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال شيت ZK مع قراءة الوقت بشكل صحيح 100% */}
      {selectedZkEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 custom-scrollbar text-slate-900 print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  ZK
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    تقرير تفريغ حركات الحضور والانصراف ومسير الرواتب (ZK-Teco Core)
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    الفرع: {selectedZkEmployee.branchName} | الشهر المالي المحتسب (ثابت 30 يوماً)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Printer size={14} />
                  <span>طباعة شيت ZK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZkEmployee(null)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-4 rounded-2xl border border-slate-300 text-xs">
              <div>
                <span className="text-slate-500 block font-semibold">الموظف والكود:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedZkEmployee.fullNameAr} (#{selectedZkEmployee.employeeCode})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">الوظيفة والفرع:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedZkEmployee.role} - {selectedZkEmployee.branchName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">الراتب وأجر اليوم:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {selectedZkEmployee.monthlySalary} ج.م (اليوم: {(selectedZkEmployee.monthlySalary / 30).toFixed(2)} ج.م)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">وردية العمل المحددة:</span>
                <span className="font-mono font-bold text-orange-700 text-sm">
                  {selectedZkEmployee.shiftStartTime || '10:00'} إلى {selectedZkEmployee.shiftEndTime || '18:00'} ({selectedZkEmployee.workingHoursPerDay}س)
                </span>
              </div>
            </div>

            {zkLoading ? (
              <div className="py-16 text-center text-xs text-slate-500">
                <Loader2 size={26} className="animate-spin mx-auto text-blue-600 mb-2" />
                جاري سحب وتفريغ سجلات ماكينة البصمة ZK...
              </div>
            ) : zkRecords.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                لا توجد حركات بصمة مسجلة لهذا الموظف
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-slate-300">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-800 font-bold">
                    <tr>
                      <th className="p-3 border-l border-slate-300 text-center">م</th>
                      <th className="p-3 border-l border-slate-300">تاريخ الوردية</th>
                      <th className="p-3 border-l border-slate-300 text-center">حضور 1 (Check In)</th>
                      <th className="p-3 border-l border-slate-300 text-center">انصراف 1 (Check Out)</th>
                      <th className="p-3 border-l border-slate-300 text-center">ساعات العمل الفعلية</th>
                      <th className="p-3 border-l border-slate-300 text-center">التأخير (دقيقة)</th>
                      <th className="p-3 border-l border-slate-300 text-center">الإضافي (دقيقة)</th>
                      <th className="p-3 border-l border-slate-300 text-center">المسافة الجغرافية</th>
                      <th className="p-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {zkPage.pageItems.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-3 border-l border-slate-200 font-mono font-bold text-slate-900">
                          {r.workDate}
                        </td>
                        {/* هنا يتم فحص وتحويل وقت الحضور إلى توقيت صريح بنجاح */}
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                          {formatTimeArabic(r.checkInTime)}
                        </td>
                        {/* هنا يتم فحص وتحويل وقت الانصراف بنجاح */}
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-bold text-orange-700 bg-orange-50/50">
                          {formatTimeArabic(r.checkOutTime)}
                        </td>
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-black text-slate-900">
                          {r.workedMinutes > 0 ? `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د` : '—'}
                        </td>
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-bold text-rose-600">
                          {r.lateMinutes > 0 ? `${r.lateMinutes} د` : '0'}
                        </td>
                        <td className="p-3 border-l border-slate-200 text-center font-mono font-bold text-blue-600">
                          {r.overtimeMinutes > 0 ? `${r.overtimeMinutes} د` : '0'}
                        </td>
                        <td className="p-3 border-l border-slate-200 text-center font-mono text-slate-600">
                          {Math.round(r.gpsDistance || 0)}م
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            حضور مؤكد
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationControls
                  page={zkPage.page}
                  pageCount={zkPage.pageCount}
                  itemCount={zkRecords.length}
                  onPageChange={zkPage.setPage}
                  isRtl
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-100 p-4 rounded-2xl border border-slate-300 text-xs">
              <div className="space-y-1">
                <span className="text-slate-600 font-bold block">ملخص الساعات الشهرية:</span>
                <p className="text-slate-800">إجمالي أيام الحضور: <strong>{zkRecords.length} يوم</strong></p>
                <p className="text-slate-800">إجمالي الساعات الفعلية: <strong>{(zkRecords.reduce((acc, r) => acc + (r.workedMinutes || 0), 0) / 60).toFixed(1)} ساعة</strong></p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-600 font-bold block">ملخص الانضباط والخصومات:</span>
                <p className="text-rose-700">إجمالي دقائق التأخير: <strong>{zkRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0)} دقيقة</strong></p>
                <p className="text-blue-700">إجمالي الساعات الإضافية: <strong>{(zkRecords.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0) / 60).toFixed(1)} ساعة</strong></p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-600 font-bold block">الصافي المالي التقريبي:</span>
                <p className="text-emerald-800 font-black text-sm">
                  {((zkRecords.reduce((acc, r) => acc + (r.workedMinutes || 0), 0) / (selectedZkEmployee.workingHoursPerDay * 60)) * (selectedZkEmployee.monthlySalary / 30)).toFixed(2)} ج.م
                </p>
                <span className="text-[10px] text-slate-500">حساب الشهر الموحد ثابتاً على 30 يوماً</span>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-700">
              <div className="space-y-6">
                <span>توقيع الموظف بالعلم</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              </div>
              <div className="space-y-6">
                <span>توقيع مدير الفرع</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              </div>
              <div className="space-y-6">
                <span>اعتماد الموارد البشرية (HR)</span>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال ملف HR */}
      {selectedHrEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 custom-scrollbar text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                <span>ملف الموظف واستمارة الموارد البشرية (HR Record)</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Printer size={13} />
                  <span>طباعة ملف HR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHrEmployee(null)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border border-orange-500/40 flex items-center justify-center shrink-0">
                {selectedHrEmployee.avatarUrl ? (
                  <img src={selectedHrEmployee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-slate-700">{selectedHrEmployee.fullNameAr.charAt(0)}</span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedHrEmployee.fullNameAr}</h2>
                <span className="text-xs text-orange-600 font-mono font-bold block">
                  #{selectedHrEmployee.employeeCode} - {selectedHrEmployee.role}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">الفرع: {selectedHrEmployee.branchName}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-orange-600 border-b border-slate-200 pb-1">1. البيانات المدنية والهوية:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-500 block">الرقم القومي:</span><span className="font-mono font-bold text-slate-900">{selectedHrEmployee.nationalId || '—'}</span></div>
                  <div><span className="text-slate-500 block">تاريخ الميلاد:</span><span className="font-mono text-slate-900">{selectedHrEmployee.birthDate || '—'}</span></div>
                  <div><span className="text-slate-500 block">النوع / الجنس:</span><span className="text-slate-900">{selectedHrEmployee.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}</span></div>
                  <div><span className="text-slate-500 block">الحالة الاجتماعية:</span><span className="text-slate-900">{selectedHrEmployee.maritalStatus || '—'}</span></div>
                  <div><span className="text-slate-500 block">الموقف التجنيدي:</span><span className="text-slate-900">{selectedHrEmployee.militaryStatus || '—'}</span></div>
                  <div><span className="text-slate-500 block">رخصة القيادة:</span><span className="text-slate-900">{selectedHrEmployee.drivingLicense || 'لا يوجد'}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-orange-600 border-b border-slate-200 pb-1">2. الاتصال والإقامة والطوارئ:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-500 block">رقم الهاتف:</span><span className="font-mono font-bold text-slate-900">{selectedHrEmployee.phone}</span></div>
                  <div><span className="text-slate-500 block">هاتف إضافي / واتساب:</span><span className="font-mono text-slate-900">{selectedHrEmployee.phoneAlt || '—'}</span></div>
                  <div><span className="text-slate-500 block">العنوان بالتفصيل:</span><span className="text-slate-900">{selectedHrEmployee.address || '—'}</span></div>
                  <div><span className="text-slate-500 block">جهة الطوارئ (الاسم):</span><span className="text-slate-900">{selectedHrEmployee.emergencyName || '—'}</span></div>
                  <div><span className="text-slate-500 block">صلة القرابة:</span><span className="text-slate-900">{selectedHrEmployee.emergencyRelation || '—'}</span></div>
                  <div><span className="text-slate-500 block">رقم هاتف الطوارئ:</span><span className="font-mono text-slate-900">{selectedHrEmployee.emergencyContact || '—'}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-orange-600 border-b border-slate-200 pb-1">3. المستحقات المالية وطريقة الصرف:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-500 block">الراتب الشهري التعاقدي:</span><span className="font-mono font-bold text-emerald-600">{selectedHrEmployee.monthlySalary} ج.م</span></div>
                  <div><span className="text-slate-500 block">طريقة التحويل المفضلة:</span><span className="text-slate-900 font-bold">{selectedHrEmployee.payoutMethod}</span></div>
                  <div><span className="text-slate-500 block">رقم الحساب / إنستاباي:</span><span className="font-mono text-slate-900">{selectedHrEmployee.payoutAccount || '—'}</span></div>
                  <div><span className="text-slate-500 block">اسم البنك / الشبكة:</span><span className="text-slate-900">{selectedHrEmployee.bankName || '—'}</span></div>
                  <div><span className="text-slate-500 block">الرقم التأميني:</span><span className="font-mono text-slate-900">{selectedHrEmployee.socialInsuranceNo || '—'}</span></div>
                  <div><span className="text-slate-500 block">ساعات العمل اليومية:</span><span className="text-slate-900 font-mono">{selectedHrEmployee.workingHoursPerDay} ساعات</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

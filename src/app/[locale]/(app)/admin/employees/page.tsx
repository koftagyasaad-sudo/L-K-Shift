'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Search,
  Building2,
  FileText,
  UserCheck,
  Edit2,
  Printer,
  X,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface EmployeeItem {
  id: number;
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
  branchId: number;
  branchName: string;
  hireDate: string;
}

export default function EmployeesManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // الفلاتر
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // المودالات
  const [selectedHrEmployee, setSelectedHrEmployee] = useState<EmployeeItem | null>(null);
  const [selectedZkEmployee, setSelectedZkEmployee] = useState<EmployeeItem | null>(null);
  const [zkRecords, setZkRecords] = useState<any[]>([]);
  const [zkLoading, setZkLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // فتح شيت ZK للموظف
  const handleOpenZkSheet = async (emp: EmployeeItem) => {
    setSelectedZkEmployee(emp);
    setZkLoading(true);
    try {
      const res = await fetch(`/api/attendance/review/all?userId=${emp.id}`, { cache: 'no-store' });
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

  const uniqueBranches = Array.from(
    new Map(employees.map((e) => [e.branchId, { id: e.branchId, name: e.branchName }])).values()
  );

  return (
    <div className="space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">إدارة شؤون الموظفين</h1>
            <p className="text-xs text-slate-400 mt-1">
              تفريغ شيتات الحضور ZK، طباعة ملفات الـ HR الرسمية، والتحكم بالصلاحيات
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs font-bold text-orange-400">
          إجمالي الموظفين المسجلين: {employees.length}
        </div>
      </div>

      {/* البحث وفلتر الفرع */}
      <div className="bg-[#0c0e18] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-3 items-center">
        <div className="w-full sm:w-60">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">جميع الفروع</option>
            {uniqueBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، رقم التليفون، أو الكود الوظيفي..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs pl-8 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </div>
      </div>

      {/* جدول الموظفين */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-[#0c0e18] border border-white/5 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تحميل بيانات الموظفين...</p>
        </div>
      ) : (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">الموظف والكود</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">الفرع</th>
                  <th className="p-4">الدور والصلاحية</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات والتقارير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{emp.fullNameAr}</div>
                      <div className="text-[11px] font-mono text-orange-400 font-bold">#{emp.employeeCode}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{emp.phone}</td>
                    <td className="p-4 font-semibold text-slate-200">{emp.branchName}</td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-[11px]">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ نشط
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* زر شيت ZK */}
                        <button
                          type="button"
                          onClick={() => handleOpenZkSheet(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition cursor-pointer"
                          title="عرض وتفريغ شيت بصمات ZK للموظف"
                        >
                          <FileText size={13} />
                          <span>شيت ZK</span>
                        </button>

                        {/* زر ملف HR */}
                        <button
                          type="button"
                          onClick={() => setSelectedHrEmployee(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition cursor-pointer"
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
        </div>
      )}

      {/* 1. مودال شيت ZK المتكامل */}
      {selectedZkEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0c0e18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-blue-400" />
                  <span>تفريغ شيت حضور ZK - {selectedZkEmployee.fullNameAr}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  كود الموظف: #{selectedZkEmployee.employeeCode} | الفرع: {selectedZkEmployee.branchName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Printer size={13} />
                  <span>طباعة الشيت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedZkEmployee(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* بطاقة ملخص ساعات الراتب (ثابت 30 يوماً) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block">الراتب الأساسي:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{selectedZkEmployee.monthlySalary} ج.م</span>
              </div>
              <div>
                <span className="text-slate-400 block">أجر اليوم (ثابت 30 يوم):</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{(selectedZkEmployee.monthlySalary / 30).toFixed(2)} ج.م</span>
              </div>
              <div>
                <span className="text-slate-400 block">إجمالي البصمات المسجلة:</span>
                <span className="font-mono font-bold text-white text-sm">{zkRecords.length} وردية</span>
              </div>
              <div>
                <span className="text-slate-400 block">إجمالي الساعات الفعلية:</span>
                <span className="font-mono font-bold text-orange-400 text-sm">
                  {(zkRecords.reduce((acc, r) => acc + (r.workedMinutes || 0), 0) / 60).toFixed(1)} ساعة
                </span>
              </div>
            </div>

            {/* جدول حركات البصمة */}
            {zkLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto text-blue-400 mb-2" />
                جاري سحب حركات الـ ZK...
              </div>
            ) : zkRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">لا توجد حركات بصمة مسجلة لهذا الموظف</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">تاريخ الوردية</th>
                      <th className="p-3 text-center">وقت الحضور</th>
                      <th className="p-3 text-center">وقت الانصراف (الأخير)</th>
                      <th className="p-3 text-center">ساعات العمل</th>
                      <th className="p-3 text-center">التأخير</th>
                      <th className="p-3 text-center">المسافة الجغرافية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {zkRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-semibold">{r.workDate}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400">
                          {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-orange-400">
                          {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-white">
                          {r.workedMinutes > 0 ? `${Math.floor(r.workedMinutes / 60)}س ${r.workedMinutes % 60}د` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono text-rose-400">
                          {r.lateMinutes > 0 ? `${r.lateMinutes} دقيقة` : 'لا يوجد'}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">{Math.round(r.gpsDistance || 0)}م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. مودال ملف HR الرسمي الكامل */}
      {selectedHrEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0c0e18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-400" />
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
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* بيانات الترويسة والصورة الشخصية */}
            <div className="flex items-center gap-5 bg-slate-900/60 p-5 rounded-2xl border border-white/5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border border-orange-500/40 flex items-center justify-center shrink-0">
                {selectedHrEmployee.avatarUrl ? (
                  <img src={selectedHrEmployee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{selectedHrEmployee.fullNameAr.charAt(0)}</span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-white">{selectedHrEmployee.fullNameAr}</h2>
                <span className="text-xs text-orange-400 font-mono font-bold block">
                  #{selectedHrEmployee.employeeCode} - {selectedHrEmployee.role}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">الفرع: {selectedHrEmployee.branchName}</span>
              </div>
            </div>

            {/* تفاصيل أقسام استمارة HR */}
            <div className="space-y-4 text-xs">
              {/* القسم 1 */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="font-bold text-orange-400 border-b border-white/5 pb-1">1. البيانات المدنية والهوية:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">الرقم القومي:</span><span className="font-mono font-bold text-white">{selectedHrEmployee.nationalId || '—'}</span></div>
                  <div><span className="text-slate-400 block">تاريخ الميلاد:</span><span className="font-mono text-white">{selectedHrEmployee.birthDate || '—'}</span></div>
                  <div><span className="text-slate-400 block">النوع / الجنس:</span><span className="text-white">{selectedHrEmployee.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}</span></div>
                  <div><span className="text-slate-400 block">الحالة الاجتماعية:</span><span className="text-white">{selectedHrEmployee.maritalStatus || '—'}</span></div>
                  <div><span className="text-slate-400 block">الموقف التجنيدي:</span><span className="text-white">{selectedHrEmployee.militaryStatus || '—'}</span></div>
                  <div><span className="text-slate-400 block">رخصة القيادة:</span><span className="text-white">{selectedHrEmployee.drivingLicense || 'لا يوجد'}</span></div>
                </div>
              </div>

              {/* القسم 2 */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="font-bold text-orange-400 border-b border-white/5 pb-1">2. الاتصال والإقامة والطوارئ:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">رقم الهاتف:</span><span className="font-mono font-bold text-white">{selectedHrEmployee.phone}</span></div>
                  <div><span className="text-slate-400 block">هاتف إضافي / واتساب:</span><span className="font-mono text-white">{selectedHrEmployee.phoneAlt || '—'}</span></div>
                  <div><span className="text-slate-400 block">العنوان بالتفصيل:</span><span className="text-white">{selectedHrEmployee.address || '—'}</span></div>
                  <div><span className="text-slate-400 block">جهة الطوارئ (الاسم):</span><span className="text-white">{selectedHrEmployee.emergencyName || '—'}</span></div>
                  <div><span className="text-slate-400 block">صلة القرابة:</span><span className="text-white">{selectedHrEmployee.emergencyRelation || '—'}</span></div>
                  <div><span className="text-slate-400 block">رقم هاتف الطوارئ:</span><span className="font-mono text-white">{selectedHrEmployee.emergencyContact || '—'}</span></div>
                </div>
              </div>

              {/* القسم 3 */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="font-bold text-orange-400 border-b border-white/5 pb-1">3. المستحقات المالية وطريقة الصرف:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">الراتب الشهري التعاقدي:</span><span className="font-mono font-bold text-emerald-400">{selectedHrEmployee.monthlySalary} ج.م</span></div>
                  <div><span className="text-slate-400 block">طريقة التحويل المفضلة:</span><span className="text-white font-bold">{selectedHrEmployee.payoutMethod}</span></div>
                  <div><span className="text-slate-400 block">رقم الحساب / إنستاباي:</span><span className="font-mono text-white">{selectedHrEmployee.payoutAccount || '—'}</span></div>
                  <div><span className="text-slate-400 block">اسم البنك / الشبكة:</span><span className="text-white">{selectedHrEmployee.bankName || '—'}</span></div>
                  <div><span className="text-slate-400 block">الرقم التأميني:</span><span className="font-mono text-white">{selectedHrEmployee.socialInsuranceNo || '—'}</span></div>
                  <div><span className="text-slate-400 block">ساعات العمل اليومية:</span><span className="text-white font-mono">{selectedHrEmployee.workingHoursPerDay} ساعات</span></div>
                </div>
              </div>

              {/* القسم 4 */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <h4 className="font-bold text-orange-400 border-b border-white/5 pb-1">4. المؤهل الدراسي والتعليم:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 block">المستوى التعليمي:</span><span className="text-white">{selectedHrEmployee.educationLevel || '—'}</span></div>
                  <div><span className="text-slate-400 block">التخصص / الكلية:</span><span className="text-white">{selectedHrEmployee.educationField || '—'}</span></div>
                  <div><span className="text-slate-400 block">سنة التخرج:</span><span className="font-mono text-white">{selectedHrEmployee.graduationYear || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

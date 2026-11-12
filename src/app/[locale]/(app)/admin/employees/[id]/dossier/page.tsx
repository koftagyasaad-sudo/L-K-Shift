'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Printer, ShieldCheck, KeyRound,
  User, Phone, CreditCard, Building2, Save, ArrowRight, Loader2, CheckCircle2 
} from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

interface EmployeeDossier {
  id: string;
  employeeCode?: string;
  fullName?: string;
  name?: string;
  branchName?: string;
  phone?: string;
  nationalId?: string;
  role?: string;
  workingHoursPerDay?: number;
  basicSalary?: number;
  verificationMode?: string;
  verification_mode?: string;
}

export default function EmployeeDossierPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeDossier | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [verificationMode, setVerificationMode] = useState('QR_GPS');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployee() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees?id=${employeeId}`, { cache: 'no-store' });
        if (res.ok) {
          const list = await res.json();
          const target = Array.isArray(list)
            ? list.find((e: EmployeeDossier) => String(e.id) === employeeId)
            : list as EmployeeDossier | null;
          if (target) {
            setEmployee(target);
            setVerificationMode(target.verificationMode || target.verification_mode || 'QR_GPS');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (employeeId) loadEmployee();
  }, [employeeId]);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: { verificationMode: string; password?: string } = {
        verificationMode,
      };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg('تم حفظ وتحديث إعدادات الموظف وكلمة المرور بنجاح');
        setNewPassword('');
      } else {
        setMsg('حدث خطأ أثناء التحديث');
      }
    } catch {
      setMsg('فشل الاتصال بالسيرفر');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-xs font-semibold text-slate-400">جاري استدعاء ملف الموظف التعاقدي...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold text-sm" dir="rtl">
        لم يتم العثور على بيانات الموظف
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* شريط الإجراءات والطباعة */}
      <div className="flex items-center justify-between no-print bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowRight size={14} /> العودة
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
        >
          <Printer size={15} /> طباعة ملف الموظف (PDF)
        </button>
      </div>

      {/* نموذج الملف الميداني الرسمي (HR Dossier) */}
      <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-xl print:p-0 print:border-none print:shadow-none">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">L-K SHIFT SYSTEMS</h1>
            <p className="text-xs font-bold text-slate-500">إدارة الموارد البشرية وشؤون العاملين</p>
            <p className="text-xs font-bold text-orange-600 mt-1">فرع: {employee.branchName || 'الفرع الرئيسي'}</p>
          </div>
          <div className="text-left">
            <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded">
              الكود الوظيفي: #{employee.employeeCode || employee.id}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5"><User size={13} /> الاسم الكامل:</span>
            <p className="text-sm font-bold text-slate-900">{employee.fullName || employee.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Phone size={13} /> رقم الموبايل:</span>
            <p className="text-sm font-mono font-bold text-slate-900" dir="ltr">{employee.phone}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5"><CreditCard size={13} /> الرقم القومي:</span>
            <p className="text-sm font-mono font-bold text-slate-900">{employee.nationalId || 'مسجل بالأرشيف الورقي'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Building2 size={13} /> المسمى الوظيفي:</span>
            <p className="text-sm font-bold text-slate-900">{employee.role}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold">ساعات العمل المقررة:</span>
            <p className="text-sm font-bold text-slate-900">{employee.workingHoursPerDay || 8} ساعات يومياً</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold">الراتب الأساسي التعاقدي:</span>
            <p className="text-sm font-mono font-bold text-emerald-700">{employee.basicSalary || 5000} ج.م</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-600">
          <div>
            <p className="font-bold mb-10">توقيع الموظف بالعلم والالتزام</p>
            <p className="border-b border-dashed border-slate-400 w-44 mx-auto"></p>
          </div>
          <div>
            <p className="font-bold mb-10">اعتماد شؤون العاملين (HR)</p>
            <p className="border-b border-dashed border-slate-400 w-44 mx-auto"></p>
          </div>
        </div>
      </div>

      {/* لوحة تحكم الأدمن في نمط البصمة وكلمة المرور */}
      <div className="no-print bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={18} /> إعدادات البصمة وأمان حساب الموظف
          </h3>
          <p className="text-xs text-slate-400 mt-1">تحديد طريقة تسجيل الحضور وتعيين كلمة المرور للموظف مباشرة</p>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={15} /> {msg}
          </div>
        )}

        <form onSubmit={handleUpdateSecurity} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                طريقة التحقق من الحضور المعتمدة لهذا الموظف:
              </label>
              <select
                value={verificationMode}
                onChange={(e) => setVerificationMode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="QR_GPS">📍 النطاق الجغرافي + 📷 الكاميرا الحية (الافتراضي)</option>
                <option value="GPS_ONLY">📍 النطاق الجغرافي فقط (في حالات تلف الكاميرا)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                تعيين كلمة مرور جديدة للموظف:
              </label>
              <div className="relative">
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="اكتب كلمة مرور جديدة..."
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 ps-10"
                />
                <KeyRound size={15} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات المحدثة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

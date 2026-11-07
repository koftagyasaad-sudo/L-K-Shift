'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, User, Phone, CreditCard, MapPin, 
  GraduationCap, Send, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';

interface ApplyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function JobApplicationPage({ params }: ApplyPageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [role, setRole] = useState('كول سنتر');
  const [branch, setBranch] = useState('فرع دسوق');
  const [education, setEducation] = useState('');
  const [address, setAddress] = useState('');
  const [experience, setExperience] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nationalId.trim().length !== 14) {
      setErrorMsg('الرقم القومي يجب أن يتكون من 14 رقماً');
      return;
    }

    setLoading(true);

    try {
      // إرسال استمارة التقديم
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch {
      setErrorMsg('حدث خطأ أثناء إرسال الاستمارة، يرجى المحاولة ثانية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-10 space-y-8">
        
        {/* الترويسة وشعار الاستمارة - وايت ثيم */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-orange-500/10 text-orange-600 rounded-2xl mx-auto flex items-center justify-center">
            <Briefcase size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">استمارة التوظيف والالتحاق بالعمل</h1>
          <p className="text-xs text-slate-500 font-medium">
            انضم إلى فريق عملنا — يرجى ملء بياناتك الشخصية والوظيفية بدقة
          </p>
        </div>

        {success ? (
          <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-lg font-black text-emerald-900">تم إرسال استمارتك بنجاح!</h2>
            <p className="text-xs text-emerald-700 leading-relaxed">
              تم تسجيل طلب التقديم الخاص بك، وسيقوم فريق الموارد البشرية (HR) بمراجعة بياناتك والتواصل معك قريباً لتحديد موعد المقابلة.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  الاسم بالكامل (رباعي) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك كما في البطاقة"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <User size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  رقم الموبايل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                  <Phone size={15} className="absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  الرقم القومي (14 رقماً) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="299xxxxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-orange-500"
                    dir="ltr"
                  />
                  <CreditCard size={15} className="absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الوظيفة المتقدم لها:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="كول سنتر">كول سنتر وخدمة عملاء</option>
                  <option value="عضو فريق (Staff)">عضو فريق (Staff مطبخ / صالة)</option>
                  <option value="مشرف وردية">مشرف وردية (Shift Leader)</option>
                  <option value="مندوب توصيل">مندوب توصيل (دليفري)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الفرع المطلوب العمل به:</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="فرع دسوق">فرع دسوق</option>
                  <option value="فرع كفر الشيخ">فرع كفر الشيخ</option>
                  <option value="الفرع الرئيسي - الإدارة">الفرع الرئيسي - الإدارة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">المؤهل الدراسي:</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="مؤهل عالي / متوسط / طالب"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <GraduationCap size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">محل الإقامة والعنوان بالتفصيل:</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المدينة، الشارع، علامة مميزة..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الخبرات السابقة وتفاصيل العمل السابق:</label>
                <textarea
                  rows={2}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="هل عملت في مطاعم أو كول سنتر من قبل؟ اذكر أسماء الأماكن..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              <span>{loading ? 'جاري إرسال الاستمارة...' : 'إرسال استمارة التقديم'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

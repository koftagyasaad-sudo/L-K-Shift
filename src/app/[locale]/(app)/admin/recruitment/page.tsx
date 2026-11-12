'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Search,
  Filter,
  Clock,
  Printer,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface ApplicationItem {
  id: number;
  fullName: string;
  phone: string;
  nationalId: string;
  birthDate: string;
  appliedRole: string;
  education: string;
  militaryStatus: string;
  address: string;
  expectedSalary: string;
  experienceYears: string;
  notes: string;
  status: string;
  createdAt: string;
}

export default function RecruitmentManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // الفلاتر
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recruitment', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCopyLink = () => {
    const applyUrl = `${window.location.origin}/${locale}/apply`;
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // استخراج قائمة الوظائف الكاملة ديناميكياً من الاستمارات المسجلة
  const standardRoles = [
    'كول سنتر',
    'عضو فريق مطبخ',
    'كابتن صالة وويتر',
    'كاشير',
    'مشرف وردية',
    'دليفري / طيار توصيل',
  ];
  const dynamicRoles = Array.from(new Set(applications.map((a) => a.appliedRole).filter(Boolean)));
  const allJobOptions = Array.from(new Set([...standardRoles, ...dynamicRoles]));

  const filteredList = applications.filter((app) => {
    const matchRole = roleFilter === 'ALL' || app.appliedRole.includes(roleFilter);
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      (app.fullName || '').toLowerCase().includes(q) ||
      (app.phone || '').includes(q) ||
      (app.nationalId || '').includes(q);
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية وأزرار الاستمارة */}
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
              <Briefcase size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إدارة استمارات التوظيف والتقديم</h1>
              <p className="text-xs text-slate-400 mt-1">متابعة طلبات التوظيف الجديدة وفرز استمارات المتقدمين للفروع</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs font-bold text-orange-400">
            إجمالي الاستمارات: {applications.length}
          </div>

          <a
            href={`/${locale}/apply`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>فتح الاستمارة</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Copy size={14} />
            <span>{copied ? 'تم النسخ!' : 'نسخ رابط الاستمارة'}</span>
          </button>
        </div>
      </div>

      {/* شريط البحث وفلتر الوظائف الشامل */}
      <div className="bg-[#0c0e18] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، الموبايل، أو الرقم القومي..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs pl-8 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">جميع الوظائف (الكل)</option>
            {allJobOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول عرض المتقدمين */}
      {loading ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 bg-[#0c0e18] border border-white/5 rounded-3xl p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-400">جاري تحميل الاستمارات...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl p-16 text-center text-slate-400">
          <Briefcase size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-xs font-bold">لا توجد طلبات تقديم مسجلة مطابقة للبحث</p>
        </div>
      ) : (
        <div className="bg-[#0c0e18] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">اسم المتقدم</th>
                  <th className="p-4">الوظيفة المتقدم لها</th>
                  <th className="p-4">المؤهل والخبرة</th>
                  <th className="p-4 text-center">الراتب المتوقع</th>
                  <th className="p-4 text-center">تاريخ التقديم</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredList.map((app) => (
                  <tr key={app.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{app.fullName}</div>
                      <div className="text-[11px] font-mono text-orange-400">{app.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-200">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                        {app.appliedRole}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-300">{app.education || 'مؤهل متوسط'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{app.address}</div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">
                      {app.expectedSalary ? `${app.expectedSalary} ج.م` : '—'}
                    </td>
                    <td className="p-4 text-center font-mono text-slate-400">
                      {app.createdAt ? String(app.createdAt).slice(0, 10) : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock size={11} /> قيد المراجعة
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        <Printer size={12} />
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

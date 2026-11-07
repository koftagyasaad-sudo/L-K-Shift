'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Search,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Inbox,
} from 'lucide-react';

export default function RecruitmentManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  // تم تفريغ الاستمارات لتكون جاهزة للمتقدمين الفعليين
  const [applications] = useState<any[]>([]);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.fullName?.includes(searchTerm) ||
      app.phone?.includes(searchTerm) ||
      app.nationalId?.includes(searchTerm);
    const matchesRole = filterRole === 'ALL' || app.appliedRole === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة استمارات التوظيف والتقديم</h1>
            <p className="text-xs text-slate-500 mt-1">
              متابعة طلبات التوظيف الجديدة وفرز استمارات المتقدمين للفروع
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
            <FileText size={14} /> إجمالي الاستمارات: 0
          </span>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، الموبايل، أو الرقم القومي..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-500" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">جميع الوظائف</option>
            <option value="كول سنتر">كول سنتر</option>
            <option value="عضو فريق (Staff)">عضو فريق (Staff)</option>
            <option value="مشرف وردية">مشرف وردية</option>
          </select>
        </div>
      </div>

      {/* عرض الحالة الفارغة النظيفة */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Inbox size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا توجد استمارات تقديم واردة حتى الآن</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            النظام جاهز وفي انتظار تقديم المرشحين عبر رابط استمارة التوظيف العامة ليتم إدراجهم هنا تلقائياً.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">اسم المتقدم</th>
                  <th className="p-4">الوظيفة والفرع</th>
                  <th className="p-4">المؤهل والخبرة</th>
                  <th className="p-4">تاريخ التقديم</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{app.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500" dir="ltr">{app.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">{app.appliedRole}</span>
                      <span className="text-[11px] text-orange-600 font-semibold">{app.branch}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{app.education}</div>
                      <div className="text-[11px] text-slate-500 font-medium">الخبرة: {app.experienceYears}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{app.appliedDate}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                        <Clock size={12} /> قيد المراجعة
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedApplication(app)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                      >
                        <Eye size={13} /> عرض وطباعة
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

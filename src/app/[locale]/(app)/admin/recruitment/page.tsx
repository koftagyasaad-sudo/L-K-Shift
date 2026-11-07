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
} from 'lucide-react';

export default function RecruitmentManagementPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  const [applications] = useState<any[]>([
    {
      id: 1,
      fullName: 'أحمد محمود إبراهيم',
      phone: '01012345678',
      email: 'ahmed.m@example.com',
      appliedRole: 'كول سنتر',
      branch: 'فرع دسوق',
      experienceYears: '3 سنوات',
      education: 'مؤهل عالي - ليسانس آداب',
      nationalId: '29801011501234',
      address: 'دسوق - شارع الجيش',
      status: 'UNDER_REVIEW',
      appliedDate: '2026-11-05',
      notes: 'خبرة سابقة في إدارة طلبات الدليفري وسرعة الرد على العملاء.',
    },
    {
      id: 2,
      fullName: 'محمد علي حسن',
      phone: '01198765432',
      email: 'm.ali@example.com',
      appliedRole: 'عضو فريق (Staff)',
      branch: 'فرع كفر الشيخ',
      experienceYears: 'سنة واحدة',
      education: 'دبلوم فني صناعي',
      nationalId: '29905051804321',
      address: 'كفر الشيخ - المحطة',
      status: 'ACCEPTED',
      appliedDate: '2026-11-06',
      notes: 'ملتزم بالمواعيد وحسن المظهر، جاهز للعمل بالوردية المسائية.',
    },
  ]);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.fullName.includes(searchTerm) ||
      app.phone.includes(searchTerm) ||
      app.nationalId.includes(searchTerm);
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
            <FileText size={14} /> إجمالي الاستمارات: {applications.length}
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

      {/* جدول المتقدمين */}
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
                    {app.status === 'ACCEPTED' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                        <CheckCircle2 size={12} /> مقبول مبدئياً
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                        <Clock size={12} /> قيد المراجعة
                      </span>
                    )}
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

      {/* نافذة استعراض وطباعة الاستمارة */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">L-K SHIFT SYSTEMS</h2>
                <p className="text-xs font-bold text-slate-500">إدارة التوظيف والموارد البشرية</p>
                <p className="text-xs font-bold text-orange-600 mt-0.5">استمارة طلب التحاق بالعمل</p>
              </div>
              <div className="text-left font-mono text-xs">
                <span className="bg-slate-900 text-white px-2.5 py-1 rounded font-bold">
                  طلب رقم: #{selectedApplication.id}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">{selectedApplication.appliedDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">الاسم بالكامل:</span>
                <span className="font-bold text-sm text-slate-900">{selectedApplication.fullName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">رقم الهاتف:</span>
                <span className="font-mono font-bold text-sm text-slate-900" dir="ltr">{selectedApplication.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">الرقم القومي:</span>
                <span className="font-mono font-bold text-slate-900">{selectedApplication.nationalId}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">الوظيفة المتقدم لها:</span>
                <span className="font-bold text-orange-600">{selectedApplication.appliedRole}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">الفرع المفضل:</span>
                <span className="font-bold text-slate-900">{selectedApplication.branch}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">المؤهل الدراسي:</span>
                <span className="font-bold text-slate-900">{selectedApplication.education}</span>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">العنوان ومحل الإقامة:</span>
                <span className="font-bold text-slate-900">{selectedApplication.address}</span>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">ملاحظات وخبرات سابقة:</span>
                <span className="font-medium text-slate-800 leading-relaxed">{selectedApplication.notes}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إغلاق النافذة
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                <Printer size={15} /> طباعة استمارة التقديم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

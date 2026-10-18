"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Building2, Users, FileText, CheckCircle2, Clock, 
  MapPin, Camera, AlertCircle, Plus, Send, Loader2, UserCheck
} from "lucide-react";
import { getBranchesAction } from "@/actions/branchActions";
import { getEmployeesAction } from "@/actions/employeeActions";
import { recordAttendanceAction } from "@/actions/attendanceActions";
import { 
  getLeaveRequestsAction, 
  createLeaveRequestAction, 
  updateLeaveStatusAction, 
  LeaveRequest 
} from "@/actions/leaveActions";

export default function DashboardPage() {
  const [stats, setStats] = useState({ branchesCount: 0, employeesCount: 0, presentCount: 0 });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "إجازة سنوية",
    recipient: "مدير الفرع المباشر",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    reason: ""
  });

  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    const [bRes, eRes, lRes] = await Promise.all([
      getBranchesAction(),
      getEmployeesAction(),
      getLeaveRequestsAction()
    ]);

    if (bRes.success && eRes.success) {
      setStats({
        branchesCount: bRes.data.length,
        employeesCount: eRes.data.length,
        presentCount: eRes.data.filter((e) => e.attendance_status === "حاضر").length
      });
    }

    if (lRes.success) {
      setLeaveRequests(lRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSimulateAttendance = (type: "IN" | "OUT") => {
    startTransition(async () => {
      const res = await recordAttendanceAction({
        employeeId: "e1",
        branchId: "b1",
        lat: 24.7136,
        lng: 46.6753,
        faceVerified: true,
        actionType: type
      });
      setAttendanceMsg(res.message);
      setTimeout(() => setAttendanceMsg(null), 4000);
      loadDashboardData();
    });
  };

  const handleCreateLeave = () => {
    if (!leaveForm.reason.trim()) return;

    startTransition(async () => {
      const res = await createLeaveRequestAction({
        id: "l-" + Date.now(),
        employee_id: "e1",
        employee_name: "سعد الكفتجي",
        type: leaveForm.type,
        recipient: leaveForm.recipient,
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason,
        status: "معلق"
      });

      if (res.success) {
        setIsLeaveModalOpen(false);
        setLeaveForm({ type: "إجازة سنوية", recipient: "مدير الفرع المباشر", startDate: "", endDate: "", reason: "" });
        loadDashboardData();
      }
    });
  };

  const handleStatusChange = (id: string, status: "مقبول" | "مرفوض") => {
    startTransition(async () => {
      await updateLeaveStatusAction(id, status);
      loadDashboardData();
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مرحباً بك، سعد الكفتجي 👋</h1>
          <p className="text-xs text-orange-100 mt-1">لديك صلاحيات مطلقة للنظام وإدارة جميع الفروع</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateAttendance("IN")}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-bold rounded-xl text-xs shadow-md hover:bg-orange-50 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>تسجيل حضور (بصمة + 3m GPS)</span>
          </button>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-900/30 backdrop-blur-md text-white border border-white/20 font-medium rounded-xl text-xs hover:bg-orange-900/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>طلب إجازة / استئذان</span>
          </button>
        </div>
      </div>

      {attendanceMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{attendanceMsg}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">إجمالي الفروع</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.branchesCount}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">إجمالي الموظفين</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.employeesCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">الموظفون الحاضرون الآن</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.presentCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Section */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <span>طلبات الإجازات والاستئذانات القائمة</span>
        </h2>

        {leaveRequests.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">لا توجد طلبات إجازة قائمة حالياً</p>
        ) : (
          <div className="space-y-3">
            {leaveRequests.map((leave) => (
              <div key={leave.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{leave.employee_name}</span>
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md font-medium">{leave.type}</span>
                  </div>
                  <p className="text-slate-500 mt-1">السبب: {leave.reason}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      من {leave.start_date} إلى {leave.end_date}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      مرسلة إلى: {leave.recipient}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {leave.status === "معلق" ? (
                    <>
                      <button onClick={() => handleStatusChange(leave.id, "مقبول")} className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">قَبُول</button>
                      <button onClick={() => handleStatusChange(leave.id, "مرفوض")} className="px-3 py-1.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">رفض</button>
                    </>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-lg font-medium ${leave.status === "مقبول" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                      {leave.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              تقديم طلب إجازة / استئذان
            </h2>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">نوع الطلب</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="إجازة سنوية">إجازة سنوية</option>
                    <option value="استئذان ساعتي">استئذان ساعتي</option>
                    <option value="إجازة مرضية">إجازة مرضية</option>
                    <option value="مأمورية عمل">مأمورية عمل خارجية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">إرسال الطلب إلى</label>
                  <select
                    value={leaveForm.recipient}
                    onChange={(e) => setLeaveForm({ ...leaveForm, recipient: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="مدير الفرع المباشر">مدير الفرع المباشر</option>
                    <option value="المدير العام">المدير العام (الإدارة العليا)</option>
                    <option value="مدير التوظيف (HR)">مدير التوظيف (HR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">تاريخ البدء</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">سبب الطلب والتفاصيل</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  rows={3}
                  placeholder="اكتب تفاصيل طلبك ليتمكن المدير من مراجعته..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">إلغاء</button>
              <button
                disabled={isPending}
                onClick={handleCreateLeave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-xs shadow-md"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Send className="w-3 h-3" />
                <span>إرسال الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

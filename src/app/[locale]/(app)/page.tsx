"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getEmployeesAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getAttendanceLogsAction } from "@/actions/attendanceActions";
import {
  getLeaveRequestsAction,
  createLeaveRequestAction,
  updateLeaveStatusAction,
} from "@/actions/leaveActions";

import type {
  EmployeeData,
  BranchData,
  AttendanceRecord,
  LeaveRequest,
} from "@/types";

import {
  Users,
  Building2,
  Clock,
  CalendarCheck,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  UserCheck,
  X,
} from "lucide-react";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isRtl = locale === "ar";

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Request Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveFormError, setLeaveFormError] = useState("");
  const [leaveFormData, setLeaveFormData] = useState({
    employee_id: "",
    recipient: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, branchRes, attRes, leaveRes] = await Promise.all([
        getEmployeesAction(),
        getBranchesAction(),
        getAttendanceLogsAction(),
        getLeaveRequestsAction(),
      ]);

      if (empRes.success) setEmployees(empRes.employees || empRes.data || []);
      if (branchRes.success) setBranches(branchRes.branches || branchRes.data || []);
      if (attRes.success) setAttendanceLogs(attRes.logs || attRes.data || []);
      if (leaveRes.success) setLeaveRequests(leaveRes.leaves || leaveRes.data || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateLeaveStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await updateLeaveStatusAction(id, status);
      if (res.success) {
        loadDashboardData();
      } else {
        alert(res.error || "فشل تحديث حالة الإجازة");
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء التحديث");
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFormData.employee_id) {
      setLeaveFormError(isRtl ? "يرجى اختيار الموظف" : "Please select an employee");
      return;
    }
    if (!leaveFormData.start_date || !leaveFormData.end_date) {
      setLeaveFormError(isRtl ? "يرجى تحديد تواريخ الإجازة" : "Please select start and end dates");
      return;
    }

    setSubmittingLeave(true);
    setLeaveFormError("");

    try {
      const res = await createLeaveRequestAction(leaveFormData);
      if (res.success) {
        setIsLeaveModalOpen(false);
        setLeaveFormData({
          employee_id: "",
          recipient: "",
          leave_type: "annual",
          start_date: "",
          end_date: "",
          reason: "",
        });
        loadDashboardData();
      } else {
        setLeaveFormError(res.error || "فشل تقديم طلب الإجازة");
      }
    } catch (err: any) {
      setLeaveFormError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSubmittingLeave(false);
    }
  };

  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");
  const todayAttendance = attendanceLogs.filter((log) => {
    const today = new Date().toISOString().split("T")[0];
    return log.created_at.startsWith(today);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black">
              {isRtl ? "مرحباً بك في نظام L&K Shift" : "Welcome to L&K Shift"}
            </h1>
            <p className="text-white/80 text-xs md:text-sm max-w-xl">
              {isRtl
                ? "لوحة التحكم الشاملة لإدارة الحضور والانصراف، الفروع، والموظفين وطلبات الإجازات."
                : "Comprehensive dashboard for attendance, branch management, employee records, and leaves."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold hover:bg-white/30 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isRtl ? "تقديم طلب إجازة" : "Request Leave"}
            </button>
            <Link
              href={`/${locale}/attendance`}
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold shadow-lg hover:bg-orange-50 transition-all"
            >
              <Clock className="w-4 h-4" />
              {isRtl ? "تسجيل الحضور" : "Log Attendance"}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                {isRtl ? "إجمالي الموظفين" : "Total Employees"}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{employees.length}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                {isRtl ? "الفروع النشطة" : "Active Branches"}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{branches.length}</h3>
            </div>
            <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                {isRtl ? "حركات اليوم" : "Today's Logs"}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{todayAttendance.length}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                {isRtl ? "طلبات إجازة المعلقة" : "Pending Leaves"}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{pendingLeaves.length}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Leave Requests */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {isRtl ? "طلبات الإجازة المعلقة" : "Pending Leave Requests"}
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              {pendingLeaves.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              {isRtl ? "لا توجد طلبات إجازة معلقة حالياً" : "No pending leave requests"}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      {leave.employee_name || leave.employee_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {leave.leave_type === "annual"
                        ? isRtl
                          ? "سنوية"
                          : "Annual"
                        : leave.leave_type === "sick"
                        ? isRtl
                          ? "مرضية"
                          : "Sick"
                        : leave.leave_type}{" "}
                      • {leave.start_date} {isRtl ? "إلى" : "to"} {leave.end_date}
                    </p>
                    {leave.recipient && (
                      <p className="text-[11px] text-orange-600 font-medium">
                        {isRtl ? "المستلم: " : "Recipient: "} {leave.recipient}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateLeaveStatus(leave.id!, "approved")}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors"
                      title={isRtl ? "قبول" : "Approve"}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateLeaveStatus(leave.id!, "rejected")}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                      title={isRtl ? "رفض" : "Reject"}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance Logs */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {isRtl ? "أحدث حركات الحضور" : "Recent Attendance"}
              </h3>
            </div>
            <Link
              href={`/${locale}/attendance`}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              {isRtl ? "عرض الكل" : "View All"}
              <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : attendanceLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              {isRtl ? "لا توجد سجلات حضور مسجلة" : "No attendance logs found"}
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        log.action_type === "IN" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {log.employee_name || log.employee_id}
                      </p>
                      <p className="text-[11px] text-gray-500">{log.branch_name || "—"}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3" dir="ltr">
                    <span className="text-[11px] font-semibold text-gray-600">
                      {new Date(log.created_at).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {log.face_verified && (
                      <ShieldCheck className="w-4 h-4 text-green-500" title="Face Verified" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isRtl ? "تقديم طلب إجازة جديد" : "New Leave Request"}
              </h3>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {leaveFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {leaveFormError}
              </div>
            )}

            <form onSubmit={handleCreateLeave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isRtl ? "اختر الموظف *" : "Select Employee *"}
                </label>
                <select
                  required
                  value={leaveFormData.employee_id}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, employee_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">{isRtl ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isRtl ? "الموجه إليه (المستلم)" : "Recipient / Target Role"}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? "مثال: المباشر / المدير العام" : "e.g., Direct Manager"}
                  value={leaveFormData.recipient}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, recipient: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "تاريخ البداية *" : "Start Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.start_date}
                    onChange={(e) =>
                      setLeaveFormData({ ...leaveFormData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isRtl ? "تاريخ النهاية *" : "End Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.end_date}
                    onChange={(e) =>
                      setLeaveFormData({ ...leaveFormData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isRtl ? "السبب" : "Reason"}
                </label>
                <textarea
                  rows={3}
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {submittingLeave && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isRtl ? "إرسال الطلب" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

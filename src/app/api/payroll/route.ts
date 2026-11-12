import { and, eq, gte, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, leaveRequests, users } from "@/db/schema";
import { authorizeApi, hasApiPermission } from "@/lib/api-auth";
import { calculatePayroll } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApi(["payroll.view", "reports.view"]);
  if ("response" in authorization) return authorization.response;

  const principal = authorization.principal;
  const canViewBranchEmployees = principal.systemRole === "SUPER_ADMIN"
    || principal.branchScope === "ALL"
    || principal.branchScope === "CUSTOM"
    || hasApiPermission(principal, "employees.view")
    || hasApiPermission(principal, "employees.manage");
  const selfOnly = principal.systemRole !== "SUPER_ADMIN"
    && principal.branchScope !== "ALL"
    && !canViewBranchEmployees;
  const employeeScope = principal.systemRole === "SUPER_ADMIN" || principal.branchScope === "ALL"
    ? sql`1=1`
    : !canViewBranchEmployees
      ? sql`users.id::text = ${principal.id}`
      : principal.branchScope === "CUSTOM"
        ? principal.allowedBranchIds.length
          ? sql`COALESCE(users.primary_branch_id::text, users.branch_id::text) = ANY(${principal.allowedBranchIds}::text[])`
          : sql`1=0`
        : principal.primaryBranchId
          ? sql`COALESCE(users.primary_branch_id::text, users.branch_id::text) = ${principal.primaryBranchId}`
          : sql`1=0`;
  const attendanceScope = selfOnly
    ? sql`attendance_logs.user_id::text = ${principal.id}`
    : employeeScope;
  const leaveRequestScope = selfOnly
    ? sql`leave_requests.user_id::text = ${principal.id}`
    : employeeScope;

  const now = new Date();
  const month = Number(request.nextUrl.searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(request.nextUrl.searchParams.get("year") ?? now.getFullYear());
  if (!Number.isSafeInteger(month) || month < 1 || month > 12
    || !Number.isSafeInteger(year) || year < 2000 || year > now.getFullYear() + 1) {
    return NextResponse.json({ message: "الشهر أو السنة غير صالحين." }, { status: 400 });
  }

  try {
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = new Date(Date.UTC(year, month, 1));
    const nextMonthStart = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;

    const [employees, logs, requests] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.fullNameAr,
          role: users.jobRole,
          branchId: users.primaryBranchId,
          branchName: branches.nameAr,
          workingHoursPerDay: users.workingHoursPerDay,
          basicSalary: users.monthlySalary,
        })
        .from(users)
        .leftJoin(branches, eq(users.primaryBranchId, branches.id))
        .where(and(eq(users.isActive, true), employeeScope))
        .limit(500),
      db
        .select({
          userId: attendanceLogs.userId,
          workDate: attendanceLogs.workDate,
          checkInTime: attendanceLogs.checkInTime,
          actualWorkedMinutes: attendanceLogs.actualWorkedMinutes,
          lateMinutes: attendanceLogs.lateMinutes,
          overtimeMinutes: attendanceLogs.overtimeMinutes,
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .where(and(
          gte(attendanceLogs.workDate, monthStart),
          lt(attendanceLogs.workDate, nextMonthStart),
          attendanceScope
        ))
        .limit(50_000),
      db
        .select({
          userId: leaveRequests.userId,
          startDate: leaveRequests.startDate,
          requestType: leaveRequests.requestType,
          status: leaveRequests.status,
          finalStatus: leaveRequests.finalStatus,
          durationDays: leaveRequests.durationDays,
          totalDays: leaveRequests.totalDays,
          advanceAmount: leaveRequests.advanceAmount,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.userId, users.id))
        .where(and(
          gte(leaveRequests.startDate, monthStart),
          lt(leaveRequests.startDate, nextMonthStart),
          leaveRequestScope
        ))
        .limit(10_000),
    ]);

    const results = employees
      .map((employee) =>
        calculatePayroll(
          {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            branchName: employee.branchName,
            workingHoursPerDay: employee.workingHoursPerDay,
            basicSalary: Number(employee.basicSalary || 0),
          },
          logs
            .filter((log) => log.userId === employee.id)
            .map((log) => ({
              workDate: log.workDate,
              checkInTime: log.checkInTime,
              actualWorkedMinutes: log.actualWorkedMinutes,
              lateMinutes: log.lateMinutes,
              overtimeMinutes: log.overtimeMinutes,
            })),
          requests
            .filter((item) => item.userId === employee.id)
            .map((item) => ({
              requestType: item.requestType,
              status: item.status,
              finalStatus: item.finalStatus,
              durationDays: item.durationDays,
              totalDays: item.totalDays,
              advanceAmount: item.advanceAmount,
            }))
        )
      );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Payroll API error:", error);
    return NextResponse.json({ message: "فشل استخراج مسير الرواتب." }, { status: 500 });
  }
}

import { and, eq, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, leaveRequests, users } from "@/db/schema";
import { authorizeApi, canAccessBranch } from "@/lib/api-auth";
import { calculatePayroll } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApi(["payroll.view", "reports.view"]);
  if ("response" in authorization) return authorization.response;

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
        .where(eq(users.isActive, true)),
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
        .where(and(
          gte(attendanceLogs.workDate, monthStart),
          lt(attendanceLogs.workDate, nextMonthStart)
        )),
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
        .where(and(
          gte(leaveRequests.startDate, monthStart),
          lt(leaveRequests.startDate, nextMonthStart)
        )),
    ]);

    const results = employees
      .filter((employee) => canAccessBranch(authorization.principal, employee.branchId))
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

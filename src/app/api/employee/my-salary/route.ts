import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { getResilientSessionUser } from "@/lib/resilient-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getResilientSessionUser();
    if (!sessionUser || (!sessionUser.id && !sessionUser.phone)) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

    const cond = sessionUser.id
      ? sql`u.id::text = ${String(sessionUser.id).trim()}`
      : sql`BTRIM(u.phone) = ${String(sessionUser.phone).trim()}`;

    const userRows = getSqlRows<Record<string, unknown>>(
      await db.execute(sql`
        SELECT
          u.id::text AS id,
          COALESCE(u.full_name_ar, 'موظف') AS "fullName",
          COALESCE(u.phone, '') AS "phone",
          COALESCE(u.employee_number, u.employee_code, '001') AS "employeeCode",
          COALESCE(u.job_role, 'موظف') AS "jobRole",
          COALESCE(b.name_ar, 'الإدارة') AS "branchName",
          COALESCE(u.monthly_salary, 0)::float8 AS "monthlySalary",
          COALESCE(u.working_hours_per_day, 8)::int AS "workingHoursPerDay",
          COALESCE(u.shift_start_time, '10:00') AS "shiftStartTime",
          COALESCE(u.shift_end_time, '18:00') AS "shiftEndTime"
        FROM users u
        LEFT JOIN branches b ON u.primary_branch_id::text = b.id::text
        WHERE ${cond}
        LIMIT 1;
      `)
    );

    const emp = userRows[0];
    if (!emp) {
      return NextResponse.json({ message: "لم يتم العثور على بيانات الموظف" }, { status: 404 });
    }

    const empId = String(emp.id);
    const basicSalary = Number(emp.monthlySalary || 0);
    const workHoursPerDay = Math.max(1, Number(emp.workingHoursPerDay || 8));
    const dailyRate = basicSalary / 30;
    const hourlyRate = dailyRate / workHoursPerDay;
    const minuteRate = hourlyRate / 60;

    // Fetch attendance logs for this employee in the selected month
    const attRows = getSqlRows<Record<string, unknown>>(
      await db.execute(sql`
        SELECT
          a.id::text AS id,
          a.check_in AS "checkIn",
          a.check_out AS "checkOut",
          COALESCE(a.distance_meters, 0)::float8 AS "distanceMeters",
          COALESCE(a.status, 'present') AS "status",
          COALESCE(b.name_ar, ${String(emp.branchName || 'الفرع')}) AS "branchName",
          CASE
            WHEN (a.check_in AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00'
              THEN ((a.check_in AT TIME ZONE 'Africa/Cairo')::date - 1)::text
            ELSE (a.check_in AT TIME ZONE 'Africa/Cairo')::date::text
          END AS "workDate"
        FROM attendance a
        LEFT JOIN branches b ON a.branch_id::text = b.id::text
        WHERE a.user_id::text = ${empId}
          AND TO_CHAR(
            CASE
              WHEN (a.check_in AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00'
                THEN (a.check_in AT TIME ZONE 'Africa/Cairo')::date - 1
              ELSE (a.check_in AT TIME ZONE 'Africa/Cairo')::date
            END,
            'YYYY-MM'
          ) = ${monthParam}
        ORDER BY a.check_in DESC;
      `)
    );

    // Also fetch any manual adjustments / bonuses / deductions if payroll_adjustments table exists
    let manualBonus = 0;
    let manualDeduction = 0;
    try {
      const adjRows = getSqlRows<Record<string, unknown>>(
        await db.execute(sql`
          SELECT
            COALESCE(SUM(CASE WHEN type IN ('BONUS', 'ADDITION', 'REWARD') THEN amount ELSE 0 END), 0)::float8 AS bonus,
            COALESCE(SUM(CASE WHEN type IN ('DEDUCTION', 'PENALTY', 'LOAN', 'ADVANCE') THEN amount ELSE 0 END), 0)::float8 AS deduction
          FROM payroll_adjustments
          WHERE user_id::text = ${empId}
            AND TO_CHAR(created_at, 'YYYY-MM') = ${monthParam};
        `)
      );
      manualBonus = Number(adjRows[0]?.bonus || 0);
      manualDeduction = Number(adjRows[0]?.deduction || 0);
    } catch {}

    let totalWorkedMinutes = 0;
    let totalLateMinutes = 0;
    let totalOvertimeMinutes = 0;

    const shiftStartParts = String(emp.shiftStartTime || "10:00").split(":").map(Number);
    const shiftStartMinutes = (shiftStartParts[0] || 10) * 60 + (shiftStartParts[1] || 0);

    const dailyRecords = attRows.map((r) => {
      const checkInStr = r.checkIn ? new Date(String(r.checkIn)).toISOString() : null;
      const checkOutStr = r.checkOut ? new Date(String(r.checkOut)).toISOString() : null;

      let workedMins = 0;
      if (checkInStr && checkOutStr) {
        workedMins = Math.max(
          0,
          Math.round((new Date(checkOutStr).getTime() - new Date(checkInStr).getTime()) / 60000)
        );
      }

      let lateMins = 0;
      if (checkInStr) {
        const cairoDate = new Date(new Date(checkInStr).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const inMins = cairoDate.getHours() * 60 + cairoDate.getMinutes();
        if (inMins > shiftStartMinutes + 15) {
          lateMins = inMins - shiftStartMinutes;
        }
      }

      const targetDayMins = workHoursPerDay * 60;
      const overtimeMins = workedMins > targetDayMins ? workedMins - targetDayMins : 0;

      totalWorkedMinutes += workedMins;
      totalLateMinutes += lateMins;
      totalOvertimeMinutes += overtimeMins;

      const dayEarned = Number(((workedMins / 60) * hourlyRate).toFixed(2));
      const dayLateDeduction = Number((lateMins * minuteRate).toFixed(2));

      return {
        id: String(r.id),
        workDate: String(r.workDate || "").slice(0, 10),
        branchName: String(r.branchName || emp.branchName || "الفرع"),
        checkInTime: checkInStr,
        checkOutTime: checkOutStr,
        workedMinutes: workedMins,
        lateMinutes: lateMins,
        overtimeMinutes: overtimeMins,
        dayEarned,
        dayLateDeduction,
        status: String(r.status || "present"),
      };
    });

    const presentDays = dailyRecords.length;
    const totalWorkedHours = Number((totalWorkedMinutes / 60).toFixed(2));
    const overtimePay = Number((totalOvertimeMinutes * minuteRate).toFixed(2));
    const lateDeduction = Number((totalLateMinutes * minuteRate).toFixed(2));
    const totalAdditions = Number((overtimePay + manualBonus).toFixed(2));
    const totalDeductions = Number((lateDeduction + manualDeduction).toFixed(2));
    const earnedByDays = Number((presentDays * dailyRate).toFixed(2));
    const netSalary = Number(Math.max(0, basicSalary + totalAdditions - totalDeductions).toFixed(2));

    return NextResponse.json({
      employee: {
        id: empId,
        fullName: emp.fullName,
        phone: emp.phone,
        employeeCode: emp.employeeCode,
        jobRole: emp.jobRole,
        branchName: emp.branchName,
        shiftStartTime: emp.shiftStartTime,
        shiftEndTime: emp.shiftEndTime,
        workingHoursPerDay: workHoursPerDay,
      },
      summary: {
        month: monthParam,
        basicSalary,
        dailyRate: Number(dailyRate.toFixed(2)),
        hourlyRate: Number(hourlyRate.toFixed(2)),
        presentDays,
        totalWorkedHours,
        totalWorkedMinutes,
        totalLateMinutes,
        totalOvertimeMinutes,
        overtimePay,
        manualBonus,
        totalAdditions,
        lateDeduction,
        manualDeduction,
        totalDeductions,
        earnedByDays,
        netSalary,
      },
      records: dailyRecords,
    });
  } catch (error) {
    console.error("my-salary GET error:", error);
    return NextResponse.json({ message: "تعذر جلب تفاصيل مسير الراتب" }, { status: 500 });
  }
}

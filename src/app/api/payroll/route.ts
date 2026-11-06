import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new URLSearchParams().get('month') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const branchId = searchParams.get('branchId');

    // 1. جلب الموظفين مع الفروع والرواتب وساعات العمل المقررة
    let usersQuery = sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as name,
        u.phone,
        COALESCE(u.job_role, u.role, 'موظف') as role,
        COALESCE(u.monthly_salary, 0) as "monthlySalary",
        COALESCE(u.working_hours_per_day, 8) as "hoursPerDay",
        COALESCE(u.working_days_per_month, 26) as "daysPerMonth",
        COALESCE(u.annual_leave_days, 21) as "annualLeaveDays",
        COALESCE(u.used_leave_days, 0) as "usedLeaveDays",
        COALESCE(u.primary_branch_id, u.branch_id) as "branchId",
        b.name_ar as "branchName",
        b.morning_shift_start::text as "morningStart",
        b.morning_shift_end::text as "morningEnd",
        b.evening_shift_start::text as "eveningStart",
        b.evening_shift_end::text as "eveningEnd",
        COALESCE(b.grace_period_minutes, 15) as "gracePeriod"
      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE u.is_active = true
    `;

    if (branchId) {
      usersQuery = sql`${usersQuery} AND COALESCE(u.primary_branch_id, u.branch_id) = ${parseInt(branchId, 10)}`;
    }

    const usersRaw = await db.execute(usersQuery);
    const usersList = Array.isArray(usersRaw) ? usersRaw : (usersRaw as any)?.rows || [];

    // 2. حساب كل موظف بدقة متناهية
    const payrollReport = await Promise.all(
      usersList.map(async (emp: any) => {
        const empId = String(emp.id);
        const monthlySalary = parseFloat(emp.monthlySalary) || 0;
        const hoursPerDay = parseInt(emp.hoursPerDay, 10) || 8;
        const daysPerMonth = parseInt(emp.daysPerMonth, 10) || 26;

        // معدل أجر الساعة = الراتب الشهري / (أيام العمل * ساعات اليوم)
        const hourlyRate = daysPerMonth * hoursPerDay > 0 ? monthlySalary / (daysPerMonth * hoursPerDay) : 0;
        const dailyRate = daysPerMonth > 0 ? monthlySalary / daysPerMonth : 0;

        // جلب حركات البصمة للشهر المحدد
        const logsRaw = await db.execute(sql`
          SELECT type, timestamp
          FROM attendance_logs
          WHERE CAST(user_id AS TEXT) = ${empId}
            AND TO_CHAR(COALESCE(timestamp, created_at), 'YYYY-MM') = ${month}
          ORDER BY COALESCE(timestamp, created_at) ASC;
        `);
        const logs = Array.isArray(logsRaw) ? logsRaw : (logsRaw as any)?.rows || [];

        // حساب عدد الأيام وساعات العمل الفعلية
        let attendedDaysCount = 0;
        let totalWorkedHours = 0;
        let totalOvertimeHours = 0;
        let totalLateMinutes = 0;

        // تجميع الحركات بحسب الأيام
        const dayMap: Record<string, { checkIn?: Date; checkOut?: Date }> = {};
        logs.forEach((l: any) => {
          const dateStr = new Date(l.timestamp).toISOString().slice(0, 10);
          if (!dayMap[dateStr]) dayMap[dateStr] = {};
          if (l.type === 'CHECK_IN' && !dayMap[dateStr].checkIn) {
            dayMap[dateStr].checkIn = new Date(l.timestamp);
          } else if (l.type === 'CHECK_OUT') {
            dayMap[dateStr].checkOut = new Date(l.timestamp);
          }
        });

        attendedDaysCount = Object.keys(dayMap).length;

        // فحص الوردية ومطابقة الحضور
        Object.values(dayMap).forEach((d) => {
          if (d.checkIn && d.checkOut) {
            const diffHours = (d.checkOut.getTime() - d.checkIn.getTime()) / (1000 * 60 * 60);
            const actualHours = Math.max(0, diffHours);
            totalWorkedHours += actualHours;

            if (actualHours > hoursPerDay) {
              totalOvertimeHours += actualHours - hoursPerDay;
            }
          } else if (d.checkIn) {
            totalWorkedHours += hoursPerDay; // احتساب اليوم العادي في حال نسيان البصمة الثانية
          }
        });

        // جلب خصومات السلف المالية المعتمدة للشهر
        const advancesRaw = await db.execute(sql`
          SELECT COALESCE(SUM(advance_amount), 0) as total
          FROM leave_requests
          WHERE user_id = ${empId}
            AND request_type = 'ADVANCE'
            AND final_status = 'APPROVED'
            AND TO_CHAR(created_at, 'YYYY-MM') = ${month};
        `);
        const totalAdvances = parseFloat((advancesRaw as any)[0]?.total || 0);

        // جلب ساعات الأذونات الزائدة للشهر (فوق الساعتين المجانية)
        const permRaw = await db.execute(sql`
          SELECT COALESCE(SUM(duration_hours), 0) as total
          FROM leave_requests
          WHERE user_id = ${empId}
            AND request_type = 'PERMISSION'
            AND final_status = 'APPROVED'
            AND TO_CHAR(start_date, 'YYYY-MM') = ${month};
        `);
        const totalPermHours = parseFloat((permRaw as any)[0]?.total || 0);
        const excessPermHours = Math.max(0, totalPermHours - 2); // ساعتان إذن مجاناً شهرياً
        const permDeduction = excessPermHours * hourlyRate;

        // حساب الإضافي المالي والخصم
        const overtimePay = totalOvertimeHours * (hourlyRate * 1.5);
        const lateDeduction = (totalLateMinutes / 60) * hourlyRate;

        // صافي الراتب المستحق النهائي
        const grossSalary = monthlySalary + overtimePay;
        const totalDeductions = totalAdvances + permDeduction + lateDeduction;
        const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions));

        return {
          id: emp.id,
          name: emp.name,
          phone: emp.phone,
          role: emp.role,
          branchName: emp.branchName || '—',
          hoursPerDay,
          daysPerMonth,
          monthlySalary,
          hourlyRate: parseFloat(hourlyRate.toFixed(2)),
          attendedDays: attendedDaysCount,
          totalWorkedHours: parseFloat(totalWorkedHours.toFixed(1)),
          overtimeHours: parseFloat(totalOvertimeHours.toFixed(1)),
          overtimePay: Math.round(overtimePay),
          excessPermHours,
          permDeduction: Math.round(permDeduction),
          totalAdvances,
          lateDeduction: Math.round(lateDeduction),
          totalDeductions: Math.round(totalDeductions),
          netSalary,
        };
      })
    );

    return NextResponse.json(payrollReport, { status: 200 });
  } catch (error: any) {
    console.error('Payroll API Error:', error);
    return NextResponse.json({ message: 'فشل حساب الرواتب', error: error?.message }, { status: 500 });
  }
}

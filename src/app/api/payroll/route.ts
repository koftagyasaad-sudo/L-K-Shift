import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    const raw = await db.execute(sql`
      SELECT 
        u.id as "userId",
        COALESCE(u.full_name_ar, u.name, 'موظف') as name,
        COALESCE(u.job_role, 'موظف') as role,
        COALESCE(b.name_ar, b.name, 'الإدارة') as "branchName",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(u.monthly_salary, 0) as "basicSalary",
        
        -- إجمالي الساعات الفعلية المسجلة
        COALESCE(SUM(l.actual_worked_minutes), 0) / 60 as "workedHours",
        COUNT(DISTINCT l.work_date) FILTER (WHERE l.check_in_time IS NOT NULL) as "workedDays",
        COALESCE(SUM(l.late_minutes), 0) as "lateMinutes",
        COALESCE(SUM(l.overtime_minutes), 0) / 60 as "overtimeHours",

        -- إجمالي أيام الإجازات المعتمدة
        COALESCE((
          SELECT SUM(duration_days) 
          FROM leave_requests lr 
          WHERE CAST(lr.user_id AS TEXT) = CAST(u.id AS TEXT)
            AND lr.final_status = 'APPROVED'
            AND lr.request_type != 'ADVANCE'
            AND EXTRACT(MONTH FROM lr.start_date) = ${month}
            AND EXTRACT(YEAR FROM lr.start_date) = ${year}
        ), 0) as "approvedLeaveDays",

        -- إجمالي السلف المصروفة والمعتمدة
        COALESCE((
          SELECT SUM(advance_amount) 
          FROM leave_requests lr 
          WHERE CAST(lr.user_id AS TEXT) = CAST(u.id AS TEXT)
            AND lr.final_status = 'APPROVED'
            AND lr.request_type = 'ADVANCE'
            AND EXTRACT(MONTH FROM lr.start_date) = ${month}
            AND EXTRACT(YEAR FROM lr.start_date) = ${year}
        ), 0) as "advanceDeductions"

      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      LEFT JOIN attendance_logs l ON CAST(l.user_id AS TEXT) = CAST(u.id AS TEXT)
        AND EXTRACT(MONTH FROM l.work_date) = ${month}
        AND EXTRACT(YEAR FROM l.work_date) = ${year}
      WHERE u.is_active = TRUE
      GROUP BY u.id, u.full_name_ar, u.name, u.job_role, b.name_ar, b.name, u.working_hours_per_day, u.monthly_salary
      ORDER BY u.id ASC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];

    // احتساب صافي الراتب الدقيق بناءً على الساعات الفعلية
    const calculatedRows = rows.map((emp: any) => {
      const basic = parseFloat(emp.basicSalary) || 0;
      const hoursPerDay = parseInt(emp.workingHoursPerDay, 10) || 8;
      const scheduledMonthlyHours = hoursPerDay * 26; // 26 يوم عمل شهرياً
      const hourlyRate = scheduledMonthlyHours > 0 ? basic / scheduledMonthlyHours : 0;
      const minuteRate = hourlyRate / 60;

      const workedHours = parseFloat(emp.workedHours) || 0;
      const approvedLeaveHours = (parseInt(emp.approvedLeaveDays, 10) || 0) * hoursPerDay;
      const overtimeHours = parseFloat(emp.overtimeHours) || 0;
      const lateMinutes = parseInt(emp.lateMinutes, 10) || 0;
      const advanceDeductions = parseFloat(emp.advanceDeductions) || 0;

      // الأجر الفعلي = الساعات الفعلية + ساعات الإجازات المدفوعة
      const earnedBase = (workedHours + approvedLeaveHours) * hourlyRate;
      const overtimePay = overtimeHours * (hourlyRate * 1.5);
      const lateDeduction = lateMinutes * minuteRate;

      let netSalary = earnedBase + overtimePay - lateDeduction - advanceDeductions;
      if (netSalary < 0) netSalary = 0;

      return {
        ...emp,
        hourlyRate: hourlyRate.toFixed(2),
        workedHours: Math.round(workedHours),
        workedDays: parseInt(emp.workedDays, 10) || 0,
        approvedLeaveDays: parseInt(emp.approvedLeaveDays, 10) || 0,
        overtimeHours: Math.round(overtimeHours),
        lateMinutes,
        advanceDeductions: Math.round(advanceDeductions),
        netSalary: Math.round(netSalary), // صافي الراتب الفعلي وليس الأساسي الكامل
      };
    });

    return NextResponse.json(calculatedRows, { status: 200 });
  } catch (error: any) {
    console.error('Payroll API Error:', error);
    return NextResponse.json({ message: 'فشل استخراج مسير الرواتب', error: error.message }, { status: 500 });
  }
}

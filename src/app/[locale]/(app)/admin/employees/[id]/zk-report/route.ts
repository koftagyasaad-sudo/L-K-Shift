import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string; locale?: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id || request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف غير محدد' }, { status: 400 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. استرجاع بيانات الموظف والوردية المحددة لفرعه
    const empRaw = await db.execute(sql`
      SELECT 
        u.id, 
        COALESCE(u.full_name_ar, u.name, 'موظف') as name,
        COALESCE(
          NULLIF(TRIM(u.employee_number), ''), 
          NULLIF(TRIM(u.employee_code), ''), 
          LPAD(u.id::text, 3, '0')
        ) as "employeeCode",
        u.phone,
        COALESCE(u.job_role, 'موظف') as role,
        COALESCE(b.name_ar, b.name, 'الإدارة') as "branchName",
        COALESCE(u.monthly_salary, 5000) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(
          NULLIF(TRIM(b.shift_schedule), ''),
          NULLIF(TRIM(CONCAT(b.shift_start_time, ' - ', b.shift_end_time)), ' - '),
          NULLIF(TRIM(b.shift_name), ''),
          '09:00 ص - 07:00 م'
        ) as "branchShift"
      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE u.id::text = ${id} OR CAST(u.id AS TEXT) = ${id}
      LIMIT 1;
    `);

    const empRows = Array.isArray(empRaw) ? empRaw : (empRaw as any)?.rows || [];
    if (!empRows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود بالنظام' }, { status: 404 });
    }
    const employee = empRows[0];
    const empCode = String(employee.employeeCode || '').trim();

    // 2. استرجاع سجلات الحضور بدون COALESCE المسبب للخطأ
    const logsRaw = await db.execute(sql`
      SELECT 
        TO_CHAR(work_date, 'YYYY-MM-DD') as "workDate",
        check_in_time,
        check_out_time,
        COALESCE(check_in_distance, 0) as "gpsDistance",
        COALESCE(check_in_photo_url, '') as "photoUrl",
        COALESCE(actual_worked_minutes, 0) as "workedMinutes",
        COALESCE(late_minutes, 0) as "lateMinutes",
        COALESCE(overtime_minutes, 0) as "overtimeMinutes",
        status
      FROM attendance_logs
      WHERE (
        user_id::text = ${id}
        OR CAST(user_id AS TEXT) = ${id}
        OR user_id::text = ${empCode}
      )
      AND EXTRACT(MONTH FROM work_date) = ${month}
      AND EXTRACT(YEAR FROM work_date) = ${year}
      ORDER BY work_date ASC;
    `);
    const logs = Array.isArray(logsRaw) ? logsRaw : (logsRaw as any)?.rows || [];

    // 3. استرجاع السلف والإجازات المعتمدة
    const leavesRaw = await db.execute(sql`
      SELECT 
        COALESCE(leave_type, request_type, 'ANNUAL') as "requestType", 
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
        TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate", 
        COALESCE(duration_days, total_days, 1) as "durationDays",
        COALESCE(advance_amount, 0) as "advanceAmount"
      FROM leave_requests
      WHERE (user_id::text = ${id} OR CAST(user_id AS TEXT) = ${id} OR user_id::text = ${empCode})
        AND (final_status = 'APPROVED' OR status::text = 'APPROVED')
        AND EXTRACT(MONTH FROM start_date) = ${month}
        AND EXTRACT(YEAR FROM start_date) = ${year};
    `);
    const leaves = Array.isArray(leavesRaw) ? leavesRaw : (leavesRaw as any)?.rows || [];

    const approvedAdvancesTotal = leaves.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.advanceAmount) || 0);
    }, 0);

    // 4. بناء تفريغ أيام الشهر ومطابقة يومي 6 و 7
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const workHours = Number(employee.workingHoursPerDay) || 8;

    const records = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, month - 1, day);
      const dayName = dayNamesAr[dObj.getDay()];

      // مطابقة اليوم
      const dayLog = logs.find((l: any) => {
        const raw = l.workDate || l.workdate || l.work_date;
        return raw && String(raw).slice(0, 10) === dateStr;
      });

      const checkInTimeRaw = dayLog?.check_in_time || dayLog?.checkInTime;
      const checkOutTimeRaw = dayLog?.check_out_time || dayLog?.checkOutTime;
      const distance = Number(dayLog?.gpsDistance || dayLog?.check_in_distance || 0);
      const photoUrl = dayLog?.photoUrl || dayLog?.check_in_photo_url || null;
      let workedMinutes = Number(dayLog?.workedMinutes || dayLog?.actual_worked_minutes || 0);
      let lateMinutes = Number(dayLog?.lateMinutes || 0);
      let overtimeMinutes = Number(dayLog?.overtimeMinutes || 0);

      // احتساب ساعات العمل إذا وُجد وقت الحضور
      if (workedMinutes === 0 && checkInTimeRaw) {
        if (checkOutTimeRaw) {
          const diffMs = new Date(checkOutTimeRaw).getTime() - new Date(checkInTimeRaw).getTime();
          if (diffMs > 0) workedMinutes = Math.round(diffMs / 60000);
        } else {
          workedMinutes = workHours * 60;
        }
      }

      const isLeave = leaves.some((lv: any) => {
        const start = String(lv.startDate || '').slice(0, 10);
        const end = String(lv.endDate || start).slice(0, 10);
        return dateStr >= start && dateStr <= end && lv.requestType !== 'ADVANCE';
      });

      let status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF' = 'ABSENT';
      if (checkInTimeRaw || workedMinutes > 0) {
        status = 'PRESENT';
      } else if (isLeave) {
        status = 'APPROVED_LEAVE';
      } else if (dObj.getDay() === 5) {
        status = 'WEEKLY_OFF';
      }

      const formatTime = (ts: string | null) => {
        if (!ts) return null;
        try {
          const d = new Date(ts);
          return isNaN(d.getTime()) ? null : d.toLocaleTimeString('ar-EG', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo'
          });
        } catch {
          return null;
        }
      };

      records.push({
        date: dateStr,
        dayName,
        shiftSchedule: employee.branchShift,
        checkInTime: formatTime(checkInTimeRaw),
        checkOutTime: formatTime(checkOutTimeRaw),
        gpsVerified: distance <= 150,
        gpsDistance: Math.round(distance),
        photoUrl,
        photoVerified: Boolean(photoUrl),
        workedMinutes: workedMinutes || (status === 'APPROVED_LEAVE' ? workHours * 60 : 0),
        lateMinutes,
        overtimeMinutes,
        status,
      });
    }

    return NextResponse.json({
      employee: {
        name: employee.name,
        employeeCode: employee.employeeCode,
        phone: employee.phone,
        role: employee.role,
        branchName: employee.branchName,
        basicSalary: parseFloat(employee.basicSalary) || 0,
        workingHoursPerDay: workHours,
      },
      monthName: monthNamesAr[month],
      year,
      records,
      approvedAdvancesTotal,
    }, { status: 200 });
  } catch (error: any) {
    console.error('ZK Report API Error:', error);
    return NextResponse.json({ message: 'فشل استخراج تقرير ZK', error: error?.message }, { status: 500 });
  }
}

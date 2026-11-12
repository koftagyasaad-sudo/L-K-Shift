import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { authorizeApi, canAccessBranch } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string; locale?: string }> }
) {
  try {
    const authorization = await authorizeApi(['payroll.view', 'reports.view']);
    if ('response' in authorization) return authorization.response;

    const resolvedParams = await context.params;
    const id = resolvedParams?.id || request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف غير محدد' }, { status: 400 });
    }
    const employeeId = id.trim();

    const [scopedEmployee] = await db
      .select({ branchId: users.primaryBranchId })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    if (!scopedEmployee) {
      return NextResponse.json({ message: 'الموظف غير موجود بالنظام' }, { status: 404 });
    }
    if (!canAccessBranch(authorization.principal, scopedEmployee.branchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. بيانات الموظف
    const empRaw = await db.execute(sql`
      SELECT 
        u.id, 
        COALESCE(u.full_name_ar, 'موظف') as name,
        COALESCE(
          NULLIF(TRIM(u.employee_number), ''), 
          NULLIF(TRIM(u.employee_code), ''), 
          LPAD(u.id::text, 3, '0')
        ) as "employeeCode",
        u.phone,
        COALESCE(u.job_role, 'موظف') as role,
        COALESCE(b.name_ar, 'الإدارة') as "branchName",
        COALESCE(u.monthly_salary, 5000) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(
          NULLIF(TRIM(b.shift_schedule), ''),
          NULLIF(TRIM(CONCAT(b.shift_start_time, ' - ', b.shift_end_time)), ' - '),
          NULLIF(TRIM(b.shift_name), ''),
          '09:00 ص - 07:00 م'
        ) as "branchShift"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      WHERE u.id = ${employeeId}
      LIMIT 1;
    `);

    const empRows = Array.isArray(empRaw) ? empRaw : (empRaw as any)?.rows || [];
    if (!empRows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود بالنظام' }, { status: 404 });
    }
    const employee = empRows[0];
    const empCode = String(employee.employeeCode || '').trim();
    const empPhone = String(employee.phone || '').trim();
    const workHours = Number(employee.workingHoursPerDay) || 8;

    // 2. استرجاع سجلات الحضور والانصراف بجميع المعرفات
    const logsRaw = await db.execute(sql`
      SELECT 
        id,
        user_id,
        work_date::text as "workDate",
        check_in_time,
        check_out_time,
        COALESCE(check_in_distance, 0) as "gpsDistance",
        COALESCE(check_in_photo_url, '') as "photoUrl",
        COALESCE(actual_worked_minutes, 0) as "workedMinutes",
        COALESCE(late_minutes, 0) as "lateMinutes",
        COALESCE(overtime_minutes, 0) as "overtimeMinutes",
        status
      FROM attendance_logs
      WHERE user_id = ${employeeId}
      ORDER BY id ASC;
    `);
    const allLogs = Array.isArray(logsRaw) ? logsRaw : (logsRaw as any)?.rows || [];

    // 3. الإجازات والسلف
    const leavesRaw = await db.execute(sql`
      SELECT 
        COALESCE(leave_type, request_type, 'ANNUAL') as "requestType", 
        start_date::text as "startDate", 
        end_date::text as "endDate", 
        COALESCE(duration_days, total_days, 1) as "durationDays",
        COALESCE(advance_amount, 0) as "advanceAmount",
        final_status
      FROM leave_requests
      WHERE user_id = ${employeeId}
        AND (final_status = 'APPROVED' OR status::text = 'APPROVED');
    `);
    const allLeaves = Array.isArray(leavesRaw) ? leavesRaw : (leavesRaw as any)?.rows || [];

    const approvedAdvancesTotal = allLeaves.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.advanceAmount) || 0);
    }, 0);

    // استخراج تاريخ السجل بدقة بتوقيت مصر
    const extractLogDate = (log: any): string | null => {
      if (log.workDate) {
        const str = String(log.workDate).trim();
        const match = str.match(/\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
      }
      if (log.check_in_time) {
        try {
          const d = new Date(log.check_in_time);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
          }
        } catch {}
      }
      return null;
    };

    // 4. بناء أيام الشهر
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const records = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, month - 1, day);
      const dayName = dayNamesAr[dObj.getDay()];

      const dayLog = allLogs.find((l: any) => extractLogDate(l) === dateStr);

      const checkInRaw = dayLog?.check_in_time || null;
      const checkOutRaw = dayLog?.check_out_time || null;
      const distance = Number(dayLog?.gpsDistance || 0);
      const photoUrl = dayLog?.photoUrl || null;
      let workedMinutes = Number(dayLog?.workedMinutes || 0);
      const lateMinutes = Number(dayLog?.lateMinutes || 0);
      const overtimeMinutes = Number(dayLog?.overtimeMinutes || 0);

      // احتساب دقائق العمل وتفادي الانقطاع
      if (workedMinutes === 0 && checkInRaw) {
        if (checkOutRaw) {
          const diffMs = new Date(checkOutRaw).getTime() - new Date(checkInRaw).getTime();
          if (diffMs > 0) workedMinutes = Math.round(diffMs / 60000);
        } else {
          workedMinutes = workHours * 60;
        }
      }

      const isLeave = allLeaves.some((lv: any) => {
        const start = String(lv.startDate || '').slice(0, 10);
        const end = String(lv.endDate || start).slice(0, 10);
        return dateStr >= start && dateStr <= end && lv.requestType !== 'ADVANCE';
      });

      let status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF' = 'ABSENT';
      if (checkInRaw || workedMinutes > 0) {
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
          return isNaN(d.getTime())
            ? null
            : d.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Africa/Cairo',
              });
        } catch {
          return null;
        }
      };

      records.push({
        date: dateStr,
        dayName,
        shiftSchedule: employee.branchShift,
        checkInTime: formatTime(checkInRaw),
        checkOutTime: formatTime(checkOutRaw),
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

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('ZK Report API Error:', error);
    return NextResponse.json({ message: 'فشل استخراج تقرير ZK', error: error?.message }, { status: 500 });
  }
}

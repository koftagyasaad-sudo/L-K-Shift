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

    // 1. استرجاع بيانات الموظف الأساسية ومواعيد وردية الفرع المحددة
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
        -- جلب مواعيد وردية الفرع المسجلة
        COALESCE(
          NULLIF(TRIM(b.shift_schedule), ''),
          NULLIF(TRIM(CONCAT(b.shift_start_time, ' - ', b.shift_end_time)), ' - '),
          NULLIF(TRIM(b.shift_name), ''),
          ''
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
    const empPhone = String(employee.phone || '').trim();

    // 2. استرجاع سجلات الحضور والانصراف بتوقيت مصر وبكافة المعرفات (ID أو الكود أو الموبايل)
    let logs: any[] = [];
    try {
      const logsRaw = await db.execute(sql`
        SELECT 
          COALESCE(
            TO_CHAR(work_date, 'YYYY-MM-DD'),
            TO_CHAR(check_in_time AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD'),
            TO_CHAR(created_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD')
          ) as "workDate",
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
          OR user_id::text = ${empPhone}
        )
        AND (
          EXTRACT(MONTH FROM COALESCE(work_date, check_in_time, created_at)) = ${month}
          OR EXTRACT(MONTH FROM (check_in_time AT TIME ZONE 'Africa/Cairo')) = ${month}
        )
        AND (
          EXTRACT(YEAR FROM COALESCE(work_date, check_in_time, created_at)) = ${year}
          OR EXTRACT(YEAR FROM (check_in_time AT TIME ZONE 'Africa/Cairo')) = ${year}
        )
        ORDER BY COALESCE(check_in_time, created_at, work_date::timestamptz) ASC;
      `);
      logs = Array.isArray(logsRaw) ? logsRaw : (logsRaw as any)?.rows || [];
    } catch (e) {
      console.warn('Attendance logs fetch notice:', e);
      logs = [];
    }

    // 3. استرجاع الإجازات والسلف المعتمدة
    let leaves: any[] = [];
    let approvedAdvancesTotal = 0;
    try {
      const leavesRaw = await db.execute(sql`
        SELECT 
          COALESCE(leave_type, request_type, 'ANNUAL') as "requestType", 
          TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
          TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate", 
          COALESCE(duration_days, total_days, 1) as "durationDays",
          COALESCE(advance_amount, 0) as "advanceAmount",
          final_status
        FROM leave_requests
        WHERE (
          user_id::text = ${id} 
          OR CAST(user_id AS TEXT) = ${id}
          OR user_id::text = ${empCode}
        )
        AND (final_status = 'APPROVED' OR status::text = 'APPROVED')
        AND EXTRACT(MONTH FROM start_date) = ${month}
        AND EXTRACT(YEAR FROM start_date) = ${year};
      `);
      leaves = Array.isArray(leavesRaw) ? leavesRaw : (leavesRaw as any)?.rows || [];

      approvedAdvancesTotal = leaves.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.advanceAmount) || 0);
      }, 0);
    } catch (e) {
      console.warn('Leaves fetch notice:', e);
      leaves = [];
    }

    // 4. تحديد مسمى الوردية من الفرع أو افتراضياً
    const workHours = Number(employee.workingHoursPerDay) || 8;
    const defaultShiftSchedule = `09:00 ص - ${workHours + 9 > 12 ? (workHours + 9 - 12) + ':00 م' : (workHours + 9) + ':00 ص'}`;
    const activeShiftSchedule = employee.branchShift ? String(employee.branchShift) : defaultShiftSchedule;

    // 5. بناء مصفوفة أيام الشهر واحتساب الساعات
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const records = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, month - 1, day);
      const dayName = dayNamesAr[dObj.getDay()];

      // مطابقة مرنة للسجل باليوم أو بوقت البصمة الفعلي بتوقيت مصر
      const dayLog = logs.find((l: any) => {
        const rawDate = l.workDate || l.workdate || l.work_date;
        if (rawDate && String(rawDate).slice(0, 10) === dateStr) return true;

        if (l.check_in_time) {
          try {
            const checkInDate = new Date(l.check_in_time).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
            if (checkInDate === dateStr) return true;
          } catch {}
        }
        return false;
      });

      const checkInTimeRaw = dayLog ? (dayLog.check_in_time || dayLog.checkInTime) : null;
      const checkOutTimeRaw = dayLog ? (dayLog.check_out_time || dayLog.checkOutTime) : null;
      const distance = dayLog ? Number(dayLog.gpsDistance ?? dayLog.gps_distance ?? 0) : 0;
      const photoUrl = dayLog ? (dayLog.photoUrl || dayLog.photo_url || null) : null;
      let workedMinutes = dayLog ? Number(dayLog.workedMinutes ?? dayLog.worked_minutes ?? 0) : 0;
      let lateMinutes = dayLog ? Number(dayLog.lateMinutes ?? dayLog.late_minutes ?? 0) : 0;
      let overtimeMinutes = dayLog ? Number(dayLog.overtimeMinutes ?? dayLog.overtime_minutes ?? 0) : 0;

      // احتساب دقائق العمل آلياً إذا توفر وقت الحضور والانصراف
      if ((!workedMinutes || workedMinutes === 0) && checkInTimeRaw) {
        if (checkOutTimeRaw) {
          const diffMs = new Date(checkOutTimeRaw).getTime() - new Date(checkInTimeRaw).getTime();
          if (diffMs > 0) {
            workedMinutes = Math.round(diffMs / 60000);
          }
        } else {
          // في حال تسجيل حضور فقط
          workedMinutes = workHours * 60;
        }
      }

      // حساب الإضافي آلياً
      const scheduledMinutes = workHours * 60;
      if (workedMinutes > scheduledMinutes && overtimeMinutes === 0) {
        overtimeMinutes = workedMinutes - scheduledMinutes;
      }

      const isLeave = leaves.some((lv: any) => {
        const start = String(lv.startDate || '').slice(0, 10);
        const end = String(lv.endDate || start).slice(0, 10);
        return dateStr >= start && dateStr <= end && lv.requestType !== 'ADVANCE';
      });

      // تحديد الحالة: الحضور الفعلي يسبق أي عطلة أسبوعية
      let status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF' = 'ABSENT';
      if (checkInTimeRaw || workedMinutes > 0) {
        status = 'PRESENT'; // حاضر حتى لو كان يوم جمعة
      } else if (isLeave) {
        status = 'APPROVED_LEAVE';
      } else if (dObj.getDay() === 5) {
        status = 'WEEKLY_OFF'; // عطلة أسبوعية فقط إذا لم يحضر
      } else {
        status = 'ABSENT';
      }

      // تنسيق الوقت بتوقيت مصر
      const formatTime = (ts: string | null) => {
        if (!ts) return null;
        try {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return null;
          return d.toLocaleTimeString('ar-EG', {
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
        shiftSchedule: activeShiftSchedule,
        checkInTime: formatTime(checkInTimeRaw),
        checkOutTime: formatTime(checkOutTimeRaw),
        gpsVerified: distance <= 150,
        gpsDistance: Math.round(distance),
        photoUrl: photoUrl || null,
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

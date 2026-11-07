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

    // 1. استرجاع بيانات الموظف الأساسية وكوده الوظيفي
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
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay"
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

    // 2. استرجاع سجلات الحضور والانصراف للشهر الحالي بصيغة تاريخ موحدة
    let logs: any[] = [];
    try {
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
        WHERE (user_id::text = ${id} OR CAST(user_id AS TEXT) = ${id})
          AND EXTRACT(MONTH FROM work_date) = ${month}
          AND EXTRACT(YEAR FROM work_date) = ${year}
        ORDER BY work_date ASC;
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
        WHERE (user_id::text = ${id} OR CAST(user_id AS TEXT) = ${id})
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

    // 4. بناء مصفوفة أيام الشهر بتفاصيل الحضور الفعلي
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const workHours = Number(employee.workingHoursPerDay) || 8;
    const shiftEndHour = 9 + workHours;
    const shiftEndLabel = shiftEndHour > 12 ? `${shiftEndHour - 12}:00 م` : `${shiftEndHour}:00 ص`;
    const dynamicShiftSchedule = `09:00 ص - ${shiftEndLabel}`;

    const records = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, month - 1, day);
      const dayName = dayNamesAr[dObj.getDay()];

      // مطابقة مرنة لتاريخ البصمة
      const dayLog = logs.find((l: any) => {
        const raw = l.workDate || l.workdate || l.work_date;
        if (!raw) return false;
        const dStr = typeof raw === 'string' ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
        return dStr === dateStr;
      });

      // استخراج قيم السجل بأمان
      const checkInTimeRaw = dayLog ? (dayLog.check_in_time || dayLog.checkInTime || dayLog.checkintime) : null;
      const checkOutTimeRaw = dayLog ? (dayLog.check_out_time || dayLog.checkOutTime || dayLog.checkouttime) : null;
      const distance = dayLog ? Number(dayLog.gpsDistance ?? dayLog.gps_distance ?? dayLog.check_in_distance ?? 0) : 0;
      const photoUrl = dayLog ? (dayLog.photoUrl || dayLog.photo_url || dayLog.check_in_photo_url || null) : null;
      const workedMinutes = dayLog ? Number(dayLog.workedMinutes ?? dayLog.worked_minutes ?? dayLog.actual_worked_minutes ?? 0) : 0;
      const lateMinutes = dayLog ? Number(dayLog.lateMinutes ?? dayLog.late_minutes ?? 0) : 0;
      const overtimeMinutes = dayLog ? Number(dayLog.overtimeMinutes ?? dayLog.overtime_minutes ?? 0) : 0;

      const isLeave = leaves.some((lv: any) => {
        const start = String(lv.startDate || lv.start_date || '').slice(0, 10);
        const end = String(lv.endDate || lv.end_date || start).slice(0, 10);
        const reqType = lv.requestType || lv.request_type || lv.leave_type;
        return dateStr >= start && dateStr <= end && reqType !== 'ADVANCE';
      });

      let status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF' = 'ABSENT';
      if (dObj.getDay() === 5) {
        status = 'WEEKLY_OFF'; // عطلة الجمعة
      } else if (isLeave) {
        status = 'APPROVED_LEAVE';
      } else if (checkInTimeRaw || workedMinutes > 0) {
        status = 'PRESENT';
      }

      const formatTime = (ts: string | null) => {
        if (!ts) return null;
        try {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return null;
          return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
          return null;
        }
      };

      records.push({
        date: dateStr,
        dayName,
        shiftSchedule: dynamicShiftSchedule,
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

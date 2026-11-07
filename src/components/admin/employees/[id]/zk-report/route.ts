import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    // 1. جلب بيانات الموظف
    const empRaw = await db.execute(sql`
      SELECT 
        u.id, 
        COALESCE(u.full_name_ar, u.name, 'موظف') as name,
        COALESCE(u.employee_number, u.id::text) as "employeeCode",
        u.phone,
        COALESCE(u.job_role, 'موظف') as role,
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        COALESCE(u.monthly_salary, 5000) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay"
      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE u.id::text = ${id}
      LIMIT 1;
    `);

    const empRows = Array.isArray(empRaw) ? empRaw : (empRaw as any)?.rows || [];
    if (!empRows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }
    const employee = empRows[0];

    // 2. جلب سجلات الحضور والانصراف للشهر
    const logsRaw = await db.execute(sql`
      SELECT 
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
      WHERE user_id::text = ${id}
        AND EXTRACT(MONTH FROM work_date) = ${month}
        AND EXTRACT(YEAR FROM work_date) = ${year}
      ORDER BY work_date ASC;
    `);
    const logs = Array.isArray(logsRaw) ? logsRaw : (logsRaw as any)?.rows || [];

    // 3. جلب الإجازات المعتمدة والسلف
    const leavesRaw = await db.execute(sql`
      SELECT 
        request_type, 
        start_date::text as "startDate", 
        end_date::text as "endDate", 
        duration_days as "durationDays",
        advance_amount as "advanceAmount",
        final_status
      FROM leave_requests
      WHERE user_id::text = ${id}
        AND final_status = 'APPROVED'
        AND EXTRACT(MONTH FROM start_date) = ${month}
        AND EXTRACT(YEAR FROM start_date) = ${year};
    `);
    const leaves = Array.isArray(leavesRaw) ? leavesRaw : (leavesRaw as any)?.rows || [];

    // إجمالي السلف المصروفة والمعتمدة
    const approvedAdvancesTotal = leaves.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.advanceAmount) || 0);
    }, 0);

    // تجهيز قائمة أيام الشهر (1 إلى نهاية الشهر)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const records = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, month - 1, day);
      const dayName = dayNamesAr[dObj.getDay()];

      const dayLog = logs.find((l: any) => l.workDate === dateStr);
      const isLeave = leaves.some((lv: any) => dateStr >= lv.startDate && dateStr <= lv.endDate && lv.request_type !== 'ADVANCE');

      let status: 'PRESENT' | 'APPROVED_LEAVE' | 'ABSENT' | 'WEEKLY_OFF' = 'ABSENT';
      if (dObj.getDay() === 5) {
        status = 'WEEKLY_OFF'; // عطلة الجمعة
      } else if (isLeave) {
        status = 'APPROVED_LEAVE';
      } else if (dayLog?.check_in_time) {
        status = 'PRESENT';
      }

      const formatTime = (ts: string | null) => {
        if (!ts) return null;
        const d = new Date(ts);
        return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
      };

      records.push({
        date: dateStr,
        dayName,
        shiftSchedule: '09:00 - 17:00',
        checkInTime: formatTime(dayLog?.check_in_time),
        checkOutTime: formatTime(dayLog?.check_out_time),
        gpsVerified: (dayLog?.gpsDistance || 0) <= 150,
        gpsDistance: Math.round(dayLog?.gpsDistance || 0),
        photoUrl: dayLog?.photoUrl || null,
        photoVerified: Boolean(dayLog?.photoUrl),
        workedMinutes: dayLog?.workedMinutes || (status === 'APPROVED_LEAVE' ? employee.workingHoursPerDay * 60 : 0),
        lateMinutes: dayLog?.lateMinutes || 0,
        overtimeMinutes: dayLog?.overtimeMinutes || 0,
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
        basicSalary: parseFloat(employee.basicSalary),
        workingHoursPerDay: parseInt(employee.workingHoursPerDay, 10),
      },
      monthName: monthNamesAr[month],
      year,
      records,
      approvedAdvancesTotal,
    });
  } catch (error: any) {
    console.error('ZK Report API Error:', error);
    return NextResponse.json({ message: 'فشل تجميع تقرير ZK', error: error.message }, { status: 500 });
  }
}

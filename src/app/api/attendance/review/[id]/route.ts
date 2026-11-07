import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ id?: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // استعلام SQL متوافق تماماً 100% مع أسماء أعمدة جداول Neon الفعلية
    const raw = await db.execute(sql`
      SELECT 
        l.id,
        l.user_id as "userId",
        COALESCE(u.full_name_ar, 'موظف') as "userName",
        COALESCE(
          NULLIF(TRIM(u.employee_number), ''), 
          LPAD(u.id::text, 3, '0')
        ) as "employeeCode",
        COALESCE(u.phone, '') as "userPhone",
        COALESCE(b.name_ar, 'الفرع الرئيسي') as "branchName",
        TO_CHAR(COALESCE(l.work_date, l.check_in_time::date, CURRENT_DATE), 'YYYY-MM-DD') as "workDate",
        l.check_in_time as "checkInTime",
        l.check_out_time as "checkOutTime",
        COALESCE(l.check_in_distance, 0) as "gpsDistance",
        COALESCE(l.check_in_photo_url, '') as "photoUrl",
        COALESCE(l.actual_worked_minutes, 0) as "workedMinutes",
        COALESCE(l.late_minutes, 0) as "lateMinutes",
        COALESCE(l.overtime_minutes, 0) as "overtimeMinutes",
        COALESCE(l.status, 'ON_TIME') as "status",
        COALESCE(u.monthly_salary, 5000) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay"
      FROM attendance_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN branches b ON COALESCE(l.branch_id, u.primary_branch_id) = b.id
      ORDER BY l.id DESC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];

    // تصفية السجلات حسب الفلاتر المحددة
    let filtered = rows;
    if (userId && userId !== 'ALL') {
      filtered = filtered.filter((r: any) => String(r.userId) === String(userId));
    }
    if (fromDate) {
      filtered = filtered.filter((r: any) => String(r.workDate) >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((r: any) => String(r.workDate) <= toDate);
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (error: any) {
    console.error('Attendance Review API Error:', error);
    return NextResponse.json(
      { message: 'فشل جلب بيانات المراجعة', error: error?.message },
      { status: 500 }
    );
  }
}

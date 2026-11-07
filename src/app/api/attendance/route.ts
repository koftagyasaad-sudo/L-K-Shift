import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. جلب كافة سجلات الحضور والانصراف والبصمات الحية
export async function GET(request: NextRequest) {
  try {
    const raw = await db.execute(sql`
      SELECT 
        l.id,
        l.user_id as "userId",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(
          NULLIF(TRIM(u.employee_number), ''), 
          NULLIF(TRIM(u.employee_code), ''), 
          LPAD(u.id::text, 3, '0')
        ) as "employeeCode",
        u.phone as "userPhone",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        TO_CHAR(COALESCE(l.work_date, l.check_in_time::date, CURRENT_DATE), 'YYYY-MM-DD') as "workDate",
        l.check_in_time as "checkInTime",
        l.check_out_time as "checkOutTime",
        COALESCE(l.check_in_distance, 0) as "gpsDistance",
        COALESCE(l.check_in_photo_url, '') as "photoUrl",
        COALESCE(l.actual_worked_minutes, 0) as "workedMinutes",
        COALESCE(l.late_minutes, 0) as "lateMinutes",
        COALESCE(l.overtime_minutes, 0) as "overtimeMinutes",
        l.status,
        COALESCE(u.monthly_salary, 5000) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay"
      FROM attendance_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN branches b ON COALESCE(l.branch_id, u.primary_branch_id) = b.id
      ORDER BY l.id DESC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ message: 'فشل استرجاع البصمات', error: error?.message }, { status: 500 });
  }
}

// 2. تسجيل حركة حضور أو انصراف جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, latitude, longitude, distanceMeters, photoBase64, userId: reqUserId } = body;

    if (!action || (action !== 'CHECK_IN' && action !== 'CHECK_OUT')) {
      return NextResponse.json({ message: 'نوع الحركة غير محدد (حضور أو انصراف)' }, { status: 400 });
    }

    let targetUserId = reqUserId;
    if (!targetUserId) {
      const authHeader = request.headers.get('x-user-id');
      if (authHeader) targetUserId = authHeader;
    }

    let userQuery;
    if (targetUserId) {
      userQuery = sql`
        SELECT id, COALESCE(primary_branch_id, branch_id, 1) as branch_id, working_hours_per_day
        FROM users 
        WHERE id::text = ${targetUserId.toString()}
        LIMIT 1;
      `;
    } else {
      userQuery = sql`
        SELECT id, COALESCE(primary_branch_id, branch_id, 1) as branch_id, working_hours_per_day
        FROM users 
        ORDER BY last_login_at DESC NULLS LAST, id ASC 
        LIMIT 1;
      `;
    }

    const userRaw = await db.execute(userQuery);
    const userRows = Array.isArray(userRaw) ? userRaw : (userRaw as any)?.rows || [];
    if (!userRows.length) {
      return NextResponse.json({ message: 'تعذر التحقق من هوية الموظف' }, { status: 401 });
    }

    const user = userRows[0];
    const userId = user.id;
    const branchId = user.branch_id || 1;

    const lat = latitude ? parseFloat(latitude) : 30.0444;
    const lng = longitude ? parseFloat(longitude) : 31.2357;
    const dist = distanceMeters ? parseFloat(distanceMeters) : 25;

    const checkExisting = await db.execute(sql`
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs
      WHERE user_id = ${userId}
        AND work_date = CURRENT_DATE
      LIMIT 1;
    `);

    const existingRows = Array.isArray(checkExisting) ? checkExisting : (checkExisting as any)?.rows || [];
    const existingLog = existingRows[0];

    if (action === 'CHECK_IN') {
      if (existingLog && existingLog.check_in_time) {
        return NextResponse.json({ 
          message: 'تم تسجيل حضورك مسبقاً لهذا اليوم، يمكنك تسجيل الانصراف عند انتهاء الوردية' 
        }, { status: 400 });
      }

      if (existingLog) {
        await db.execute(sql`
          UPDATE attendance_logs
          SET 
            branch_id = ${branchId},
            check_in_time = NOW(),
            check_in_lat = ${lat},
            check_in_lng = ${lng},
            check_in_distance = ${dist},
            check_in_photo_url = ${photoBase64 || null},
            status = 'ON_TIME'
          WHERE id = ${existingLog.id};
        `);
      } else {
        await db.execute(sql`
          INSERT INTO attendance_logs (
            user_id,
            branch_id,
            work_date,
            check_in_time,
            check_in_lat,
            check_in_lng,
            check_in_distance,
            check_in_photo_url,
            status,
            actual_worked_minutes,
            late_minutes,
            overtime_minutes,
            created_at
          ) VALUES (
            ${userId},
            ${branchId},
            CURRENT_DATE,
            NOW(),
            ${lat},
            ${lng},
            ${dist},
            ${photoBase64 || null},
            'ON_TIME',
            0,
            0,
            0,
            NOW()
          );
        `);
      }

      return NextResponse.json({ success: true, message: 'تم تسجيل حضورك بنجاح' });
    }

    if (action === 'CHECK_OUT') {
      if (!existingLog || !existingLog.check_in_time) {
        return NextResponse.json({ 
          message: 'لم يتم تسجيل حضورك اليوم بعد، يجب تسجيل الحضور أولاً قبل الانصراف' 
        }, { status: 400 });
      }

      await db.execute(sql`
        UPDATE attendance_logs
        SET 
          branch_id = COALESCE(branch_id, ${branchId}),
          check_out_time = NOW(),
          check_out_lat = ${lat},
          check_out_lng = ${lng},
          check_out_distance = ${dist},
          actual_worked_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60)::integer)
        WHERE id = ${existingLog.id};
      `);

      return NextResponse.json({ success: true, message: 'تم تسجيل انصرافك بنجاح' });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Attendance submit error:', error);
    return NextResponse.json({ message: error?.message || 'حدث خطأ أثناء حفظ البصمة' }, { status: 500 });
  }
}

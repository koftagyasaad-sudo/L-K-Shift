import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 1. جلب كافة سجلات البصمات بدقة كاملة بدون دمج يحذف البيانات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const raw = await db.execute(sql`
      SELECT 
        l.id,
        l.user_id as "userId",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(NULLIF(TRIM(u.employee_number), ''), LPAD(u.id::text, 3, '0')) as "employeeCode",
        COALESCE(u.phone, '') as "userPhone",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
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
      LEFT JOIN users u ON (l.user_id = u.id OR l.user_id::text = u.employee_number)
      LEFT JOIN branches b ON COALESCE(l.branch_id, u.primary_branch_id) = b.id
      WHERE ${
        userId && userId !== 'ALL'
          ? sql`(l.user_id::text = ${userId} OR u.id::text = ${userId} OR u.employee_number = ${userId})`
          : sql`1=1`
      }
      ORDER BY l.id DESC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];

    // تسوية البيانات لضمان قراءتها بالحروف الكبيرة والصغيرة دون أي خطأ
    let logs = rows.map((r: any) => ({
      id: r.id,
      userId: r.userId ?? r.user_id,
      userName: r.userName ?? r.user_name ?? 'موظف',
      employeeCode: r.employeeCode ?? r.employee_code ?? '001',
      userPhone: r.userPhone ?? r.user_phone ?? '',
      branchName: r.branchName ?? r.branch_name ?? 'الفرع الرئيسي',
      workDate: r.workDate ?? r.work_date,
      checkInTime: r.checkInTime ?? r.check_in_time ?? null,
      checkOutTime: r.checkOutTime ?? r.check_out_time ?? null,
      gpsDistance: Number(r.gpsDistance ?? r.gps_distance ?? 0),
      photoUrl: r.photoUrl ?? r.photo_url ?? '',
      workedMinutes: Number(r.workedMinutes ?? r.worked_minutes ?? 0),
      lateMinutes: Number(r.lateMinutes ?? r.late_minutes ?? 0),
      overtimeMinutes: Number(r.overtimeMinutes ?? r.overtime_minutes ?? 0),
      status: r.status ?? 'ON_TIME',
      basicSalary: Number(r.basicSalary ?? 5000),
      workingHoursPerDay: Number(r.workingHoursPerDay ?? 8),
    }));

    if (fromDate) {
      logs = logs.filter((r: any) => String(r.workDate) >= fromDate);
    }
    if (toDate) {
      logs = logs.filter((r: any) => String(r.workDate) <= toDate);
    }

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// 2. تسجيل حركة الحضور والانصراف
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, latitude, longitude, photoBase64, userId: reqUserId, branchId: reqBranchId, offlineTimestamp } = body;

    if (!action || (action !== 'CHECK_IN' && action !== 'CHECK_OUT')) {
      return NextResponse.json({ message: 'نوع الحركة غير محدد (حضور أو انصراف)' }, { status: 400 });
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return NextResponse.json({
        message: 'تعذر التقاط موقعك الجغرافي بدقة. يرجى تفعيل الـ GPS والسماح بالإذن.',
      }, { status: 400 });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    let targetUserId = reqUserId;
    if (!targetUserId) {
      const authHeader = request.headers.get('x-user-id');
      if (authHeader) targetUserId = authHeader;
    }

    // التحقق من هوية الموظف بالـ ID أو رقم الهاتف أو المسلسل الوظيفي
    const userRaw = await db.execute(sql`
      SELECT 
        u.id, 
        COALESCE(u.full_name_ar, u.name, 'موظف') as user_name,
        COALESCE(${reqBranchId ? parseInt(reqBranchId, 10) : null}, u.primary_branch_id, u.branch_id, 1) as branch_id,
        u.working_hours_per_day,
        b.latitude as branch_lat,
        b.longitude as branch_lng,
        COALESCE(b.geofence_radius, 150) as branch_radius,
        COALESCE(b.name_ar, b.name, 'الفرع') as branch_name
      FROM users u
      LEFT JOIN branches b ON b.id = COALESCE(${reqBranchId ? parseInt(reqBranchId, 10) : null}, u.primary_branch_id, u.branch_id, 1)
      WHERE (
        u.id::text = ${targetUserId ? targetUserId.toString() : '1'}
        OR u.phone = ${targetUserId ? targetUserId.toString() : ''}
        OR u.employee_number = ${targetUserId ? targetUserId.toString() : ''}
      )
      LIMIT 1;
    `);

    const userRows = Array.isArray(userRaw) ? userRaw : (userRaw as any)?.rows || [];
    if (!userRows.length) {
      return NextResponse.json({ message: 'تعذر التحقق من بيانات الموظف' }, { status: 401 });
    }

    const user = userRows[0];
    const userId = user.id;
    const branchId = user.branch_id || 1;

    let bLat = parseFloat(user.branch_lat);
    let bLng = parseFloat(user.branch_lng);
    const allowedRadius = Number(user.branch_radius) || 150;

    let actualDistance = calculateDistanceMeters(userLat, userLng, bLat, bLng);
    const invertedDistance = calculateDistanceMeters(userLat, userLng, bLng, bLat);
    if (invertedDistance < actualDistance) {
      actualDistance = invertedDistance;
    }

    if (actualDistance > allowedRadius + 100) {
      return NextResponse.json({
        success: false,
        message: `أنت خارج نطاق ${user.branch_name}! المسافة: ${actualDistance}م (المسموح: ${allowedRadius}م).`,
        currentDistance: actualDistance,
        allowedRadius: allowedRadius,
      }, { status: 400 });
    }

    // الشيفت العام: من 10 ص حتى 4 فجراً لليوم التالي
    const now = offlineTimestamp ? new Date(offlineTimestamp) : new Date();
    const cairoHour = (now.getUTCHours() + 2) % 24;
    const cairoMinute = now.getUTCMinutes();

    let workDateObj = new Date(now);
    if (cairoHour >= 0 && cairoHour < 6) {
      workDateObj.setDate(workDateObj.getDate() - 1);
    }
    const workDateStr = workDateObj.toISOString().slice(0, 10);

    let lateMinutes = 0;
    if (action === 'CHECK_IN' && cairoHour >= 10 && cairoHour < 24) {
      const minutesSince10AM = (cairoHour - 10) * 60 + cairoMinute;
      if (minutesSince10AM > 15) {
        lateMinutes = minutesSince10AM - 15;
      }
    }

    const checkExisting = await db.execute(sql`
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs
      WHERE user_id = ${userId}
        AND work_date = ${workDateStr}::date
      ORDER BY id DESC
      LIMIT 1;
    `);

    const existingRows = Array.isArray(checkExisting) ? checkExisting : (checkExisting as any)?.rows || [];
    const existingLog = existingRows[0];

    if (action === 'CHECK_IN') {
      if (existingLog && existingLog.check_in_time) {
        await db.execute(sql`
          UPDATE attendance_logs
          SET 
            check_in_distance = ${actualDistance},
            check_in_photo_url = COALESCE(${photoBase64 || null}, check_in_photo_url),
            updated_at = NOW()
          WHERE id = ${existingLog.id};
        `);
        return NextResponse.json({
          success: true,
          message: 'تم تحديث بصمة حضورك للوردية الحالية بنجاح.',
        });
      }

      await db.execute(sql`
        INSERT INTO attendance_logs (
          user_id, branch_id, work_date, check_in_time,
          check_in_lat, check_in_lng, check_in_distance,
          check_in_photo_url, status, actual_worked_minutes,
          late_minutes, overtime_minutes, created_at
        ) VALUES (
          ${userId}, ${branchId}, ${workDateStr}::date, NOW(),
          ${userLat}, ${userLng}, ${actualDistance},
          ${photoBase64 || null}, 'ON_TIME', 0, ${lateMinutes}, 0, NOW()
        );
      `);

      try {
        await db.execute(sql`
          INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
          SELECT id, ${userId}, 'تسجيل حضور موظف', 
                 ${'سجل الموظف (' + user.user_name + ') حضوره بفرع ' + user.branch_name},
                 'ATTENDANCE', '/admin/attendance-review', false, NOW()
          FROM users WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'مدير فرع') AND id != ${userId};
        `);
      } catch {}

      return NextResponse.json({
        success: true,
        message: `تم تسجيل حضورك في وردية (${workDateStr}) بنجاح داخل نطاق ${user.branch_name}.`,
      });
    }

    if (action === 'CHECK_OUT') {
      if (!existingLog || !existingLog.check_in_time) {
        return NextResponse.json({
          message: 'يجب تسجيل الحضور أولاً قبل تسجيل الانصراف لهذه الوردية.',
        }, { status: 400 });
      }

      await db.execute(sql`
        UPDATE attendance_logs
        SET 
          check_out_time = NOW(),
          check_out_lat = ${userLat},
          check_out_lng = ${userLng},
          check_out_distance = ${actualDistance},
          actual_worked_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60)::integer),
          updated_at = NOW()
        WHERE id = ${existingLog.id};
      `);

      return NextResponse.json({
        success: true,
        message: 'تم اعتماد بصمة انصرافك الأخيرة وتحديث إجمالي ساعات عمل الوردية.',
      });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Attendance submit error:', error);
    return NextResponse.json({ message: error?.message || 'حدث خطأ أثناء حفظ البصمة' }, { status: 500 });
  }
}

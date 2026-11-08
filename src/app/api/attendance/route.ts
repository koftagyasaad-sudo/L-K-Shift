import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// دالة حساب المسافة الدقيقة بين نقطتين بالأمتار (Haversine Formula)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 1. استرجاع حركات البصمة
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

// 2. تسجيل حركة الحضور أو الانصراف مع القفل الجغرافي الصارم
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, latitude, longitude, photoBase64, userId: reqUserId, offlineTimestamp } = body;

    if (!action || (action !== 'CHECK_IN' && action !== 'CHECK_OUT')) {
      return NextResponse.json({ message: 'نوع الحركة غير محدد (حضور أو انصراف)' }, { status: 400 });
    }

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return NextResponse.json({
        message: 'تعذر التقاط موقعك الجغرافي. يرجى تفعيل الـ GPS والسماح بالوصول للموقع.',
      }, { status: 400 });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng) || (userLat === 0 && userLng === 0)) {
      return NextResponse.json({
        message: 'إحداثيات الموقع غير صالحة. يرجى إعادة المحاولة بدقة عالية.',
      }, { status: 400 });
    }

    let targetUserId = reqUserId;
    if (!targetUserId) {
      const authHeader = request.headers.get('x-user-id');
      if (authHeader) targetUserId = authHeader;
    }

    let userQuery = targetUserId
      ? sql`
          SELECT 
            u.id, 
            COALESCE(u.full_name_ar, u.name, 'موظف') as user_name,
            COALESCE(u.primary_branch_id, u.branch_id, 1) as branch_id,
            u.working_hours_per_day,
            b.latitude as branch_lat,
            b.longitude as branch_lng,
            COALESCE(b.geofence_radius, 60) as branch_radius,
            COALESCE(b.name_ar, b.name, 'الفرع') as branch_name
          FROM users u
          LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id, 1) = b.id
          WHERE u.id::text = ${targetUserId.toString()}
          LIMIT 1;
        `
      : sql`
          SELECT 
            u.id, 
            COALESCE(u.full_name_ar, u.name, 'موظف') as user_name,
            COALESCE(u.primary_branch_id, u.branch_id, 1) as branch_id,
            u.working_hours_per_day,
            b.latitude as branch_lat,
            b.longitude as branch_lng,
            COALESCE(b.geofence_radius, 60) as branch_radius,
            COALESCE(b.name_ar, b.name, 'الفرع') as branch_name
          FROM users u
          LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id, 1) = b.id
          ORDER BY u.last_login_at DESC NULLS LAST, u.id ASC 
          LIMIT 1;
        `;

    const userRaw = await db.execute(userQuery);
    const userRows = Array.isArray(userRaw) ? userRaw : (userRaw as any)?.rows || [];
    if (!userRows.length) {
      return NextResponse.json({ message: 'تعذر التحقق من بيانات الموظف' }, { status: 401 });
    }

    const user = userRows[0];
    const userId = user.id;
    const branchId = user.branch_id || 1;

    let actualDistance = 0;
    const branchLat = parseFloat(user.branch_lat);
    const branchLng = parseFloat(user.branch_lng);
    const allowedRadius = Number(user.branch_radius) || 60;

    if (!isNaN(branchLat) && !isNaN(branchLng)) {
      actualDistance = calculateDistanceMeters(userLat, userLng, branchLat, branchLng);
    }

    if (!isNaN(branchLat) && !isNaN(branchLng) && actualDistance > allowedRadius) {
      return NextResponse.json({
        success: false,
        message: `عفواً، لا يمكنك تسجيل ${action === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} خارج نطاق الفرع! أنت تبعد ${actualDistance} متر عن (${user.branch_name})، بينما النطاق المسموح به هو ${allowedRadius} متر فقط.`,
        currentDistance: actualDistance,
        allowedRadius: allowedRadius,
      }, { status: 400 });
    }

    const recordTime = offlineTimestamp ? new Date(offlineTimestamp) : new Date();
    const workDateStr = recordTime.toISOString().slice(0, 10);

    const checkExisting = await db.execute(sql`
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs
      WHERE user_id = ${userId}
        AND work_date = ${workDateStr}::date
      LIMIT 1;
    `);

    const existingRows = Array.isArray(checkExisting) ? checkExisting : (checkExisting as any)?.rows || [];
    const existingLog = existingRows[0];

    if (action === 'CHECK_IN') {
      if (existingLog && existingLog.check_in_time) {
        return NextResponse.json({ 
          message: 'تم تسجيل حضورك بالفعل لهذا اليوم، يمكنك تسجيل الانصراف عند نهاية الوردية.' 
        }, { status: 400 });
      }

      if (existingLog) {
        await db.execute(sql`
          UPDATE attendance_logs
          SET 
            branch_id = ${branchId},
            check_in_time = ${recordTime.toISOString()},
            check_in_lat = ${userLat},
            check_in_lng = ${userLng},
            check_in_distance = ${actualDistance},
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
            ${workDateStr}::date,
            ${recordTime.toISOString()},
            ${userLat},
            ${userLng},
            ${actualDistance},
            ${photoBase64 || null},
            'ON_TIME',
            0,
            0,
            0,
            NOW()
          );
        `);
      }

      try {
        const managers = await db.execute(sql`
          SELECT id FROM users 
          WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'مدير فرع')
            AND (primary_branch_id = ${branchId} OR role = 'مدير النظام' OR role = 'SUPER_ADMIN');
        `);
        const managerRows = Array.isArray(managers) ? managers : (managers as any)?.rows || [];
        const notifTitle = 'تسجيل حضور موظف';
        const notifMsg = `سجل الموظف (${user.user_name}) حضوره بفرع (${user.branch_name}) على بعد ${actualDistance}م.`;

        for (const m of managerRows) {
          if (m.id !== userId) {
            await db.execute(sql`
              INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
              VALUES (${m.id}, ${userId}, ${notifTitle}, ${notifMsg}, 'ATTENDANCE', '/admin/attendance-review', false, NOW());
            `);
          }
        }
      } catch (errNotif) {
        console.error('Failed to notify managers:', errNotif);
      }

      return NextResponse.json({ 
        success: true, 
        message: `تم تسجيل حضورك بنجاح داخل نطاق (${user.branch_name}) على بعد ${actualDistance} متر.` 
      });
    }

    if (action === 'CHECK_OUT') {
      if (!existingLog || !existingLog.check_in_time) {
        return NextResponse.json({ 
          message: 'يجب تسجيل الحضور أولاً قبل تسجيل الانصراف.' 
        }, { status: 400 });
      }

      await db.execute(sql`
        UPDATE attendance_logs
        SET 
          branch_id = COALESCE(branch_id, ${branchId}),
          check_out_time = ${recordTime.toISOString()},
          check_out_lat = ${userLat},
          check_out_lng = ${userLng},
          check_out_distance = ${actualDistance},
          actual_worked_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (${recordTime.toISOString()}::timestamptz - check_in_time)) / 60)::integer)
        WHERE id = ${existingLog.id};
      `);

      try {
        const managers = await db.execute(sql`
          SELECT id FROM users 
          WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'مدير فرع')
            AND (primary_branch_id = ${branchId} OR role = 'مدير النظام' OR role = 'SUPER_ADMIN');
        `);
        const managerRows = Array.isArray(managers) ? managers : (managers as any)?.rows || [];
        const notifTitle = 'تسجيل انصراف موظف';
        const notifMsg = `سجل الموظف (${user.user_name}) انصرافه من فرع (${user.branch_name}) على بعد ${actualDistance}م.`;

        for (const m of managerRows) {
          if (m.id !== userId) {
            await db.execute(sql`
              INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
              VALUES (${m.id}, ${userId}, ${notifTitle}, ${notifMsg}, 'ATTENDANCE', '/admin/attendance-review', false, NOW());
            `);
          }
        }
      } catch (errNotif) {
        console.error('Failed to notify managers on checkout:', errNotif);
      }

      return NextResponse.json({ 
        success: true, 
        message: `تم تسجيل انصرافك بنجاح من (${user.branch_name}) على بعد ${actualDistance} متر.` 
      });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Attendance submit error:', error);
    return NextResponse.json({ message: error?.message || 'حدث خطأ أثناء حفظ البصمة' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// دالة حساب المسافة الدقيقة (Haversine Formula) مع حماية ضد عكس الإحداثيات
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

    let targetUserId = reqUserId;
    if (!targetUserId) {
      const authHeader = request.headers.get('x-user-id');
      if (authHeader) targetUserId = authHeader;
    }

    const userRaw = await db.execute(sql`
      SELECT 
        u.id, 
        COALESCE(u.full_name_ar, u.name, 'موظف') as user_name,
        COALESCE(u.primary_branch_id, u.branch_id, 1) as branch_id,
        u.working_hours_per_day,
        b.latitude as branch_lat,
        b.longitude as branch_lng,
        COALESCE(b.geofence_radius, 100) as branch_radius,
        COALESCE(b.name_ar, b.name, 'الفرع') as branch_name
      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id, 1) = b.id
      WHERE u.id::text = ${targetUserId ? targetUserId.toString() : '1'}
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
    const allowedRadius = Number(user.branch_radius) || 100;

    // فحص المسافة بالترتيب العادي وبالترتيب المعكوس لعلاج خطأ إدخال الفرع
    let actualDistance = calculateDistanceMeters(userLat, userLng, bLat, bLng);
    const invertedDistance = calculateDistanceMeters(userLat, userLng, bLng, bLat);
    if (invertedDistance < actualDistance) {
      actualDistance = invertedDistance;
    }

    // السماح بهامش خطأ الأبراج داخل المباني (50 متر إضافية)
    if (actualDistance > allowedRadius + 50) {
      return NextResponse.json({
        success: false,
        message: `أنت خارج نطاق الفرع! المسافة المحسوبة: ${actualDistance} متر عن (${user.branch_name})، بينما النطاق المسموح هو ${allowedRadius} متر.`,
        currentDistance: actualDistance,
        allowedRadius: allowedRadius,
      }, { status: 400 });
    }

    // حساب تاريخ الوردية لنظام الشيفت الليلي (10 ص إلى 4 ص اليوم التالي)
    const now = offlineTimestamp ? new Date(offlineTimestamp) : new Date();
    // تحويل التوقيت لتوقيت مصر (UTC+2)
    const cairoHour = (now.getUTCHours() + 2) % 24;

    let workDateObj = new Date(now);
    // إذا كانت البصمة بين 12 منتصف الليل وحتى 6 صباحاً، تُعتبر تابعة لوردية اليوم السابق
    if (cairoHour >= 0 && cairoHour < 6) {
      workDateObj.setDate(workDateObj.getDate() - 1);
    }
    const workDateStr = workDateObj.toISOString().slice(0, 10);

    // البحث عن سجل اليوم لهذا الموظف
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
        // إذا كان مسجلاً حضوراً من قبل، يتم تحديث موقعه وسيلفيه دون إنشاء يوم مكرر
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
          message: 'تم تحديث بيانات حضورك للوردية الحالية بنجاح.',
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
          ${photoBase64 || null}, 'ON_TIME', 0, 0, 0, NOW()
        );
      `);

      // إرسال إشعار للمدير بأمان
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
        message: `تم تسجيل حضورك بنجاح في وردية (${workDateStr}) على بعد ${actualDistance}م.`,
      });
    }

    if (action === 'CHECK_OUT') {
      if (!existingLog || !existingLog.check_in_time) {
        return NextResponse.json({
          message: 'يجب تسجيل الحضور أولاً قبل تسجيل الانصراف لهذه الوردية.',
        }, { status: 400 });
      }

      // اعتماد البصمة الأخيرة دائماً وتحديث ساعات العمل بدقة
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

      // إشعار الانصراف
      try {
        await db.execute(sql`
          INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
          SELECT id, ${userId}, 'تسجيل انصراف موظف', 
                 ${'سجل الموظف (' + user.user_name + ') انصرافه (البصمة الأخيرة)'},
                 'ATTENDANCE', '/admin/attendance-review', false, NOW()
          FROM users WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'مدير فرع') AND id != ${userId};
        `);
      } catch {}

      return NextResponse.json({
        success: true,
        message: `تم اعتماد بصمة انصرافك الأخيرة بنجاح وتحديث ساعات عمل الوردية.`,
      });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Attendance submit error:', error);
    return NextResponse.json({ message: error?.message || 'حدث خطأ أثناء حفظ البصمة' }, { status: 500 });
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const code = searchParams.get('code');
    const phone = searchParams.get('phone');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    let rawLogs: any[] = [];
    try {
      const res = await db.execute(sql`SELECT * FROM attendance_logs ORDER BY id DESC;`);
      rawLogs = Array.isArray(res) ? res : (res as any)?.rows || [];
    } catch {}

    let rawAltLogs: any[] = [];
    try {
      const resAlt = await db.execute(sql`SELECT * FROM attendance ORDER BY id DESC;`);
      rawAltLogs = Array.isArray(resAlt) ? resAlt : (resAlt as any)?.rows || [];
    } catch {}

    let usersList: any[] = [];
    try {
      const resU = await db.execute(sql`
        SELECT 
          id, 
          COALESCE(full_name_ar, name, 'موظف') as name,
          COALESCE(NULLIF(TRIM(employee_number), ''), LPAD(id::text, 3, '0')) as code,
          COALESCE(phone, '') as phone,
          COALESCE(monthly_salary, 5000) as salary,
          COALESCE(working_hours_per_day, 8) as hours,
          primary_branch_id,
          branch_id
        FROM users;
      `);
      usersList = Array.isArray(resU) ? resU : (resU as any)?.rows || [];
    } catch {}

    let branchesList: any[] = [];
    try {
      const resB = await db.execute(sql`SELECT id, COALESCE(name_ar, name, 'الفرع') as name FROM branches;`);
      branchesList = Array.isArray(resB) ? resB : (resB as any)?.rows || [];
    } catch {}

    const userById = new Map();
    const userByPhone = new Map();
    const userByCode = new Map();

    usersList.forEach((u) => {
      userById.set(String(u.id), u);
      if (u.phone) userByPhone.set(String(u.phone), u);
      if (u.code) userByCode.set(String(u.code), u);
    });

    const branchMap = new Map();
    branchesList.forEach((b) => branchMap.set(String(b.id), b.name));

    const allRecords = [...rawLogs, ...rawAltLogs];
    const uniqueMap = new Map();

    allRecords.forEach((l) => {
      const rawUid = String(l.user_id ?? l.userId ?? '');
      const u = userById.get(rawUid) || userByPhone.get(rawUid) || userByCode.get(rawUid) || {};

      const bId = String(l.branch_id ?? l.branchId ?? u.primary_branch_id ?? u.branch_id ?? '1');
      const branchName = branchMap.get(bId) || 'الفرع الرئيسي';

      let wDate = '';
      if (l.work_date) {
        wDate = String(l.work_date).slice(0, 10);
      } else if (l.check_in_time) {
        wDate = String(l.check_in_time).slice(0, 10);
      } else if (l.created_at) {
        wDate = String(l.created_at).slice(0, 10);
      } else {
        wDate = new Date().toISOString().slice(0, 10);
      }

      // قراءة الوقت مع التأكد من عدم رجوعه فارغاً إذا كان مسجلاً في created_at
      const rawCheckIn = l.check_in_time || l.checkInTime || l.created_at || null;
      const rawCheckOut = l.check_out_time || l.checkOutTime || null;

      const item = {
        id: l.id,
        userId: u.id || (rawUid ? parseInt(rawUid, 10) : 0),
        userName: u.name || l.user_name || 'موظف',
        employeeCode: u.code || '001',
        userPhone: u.phone || l.user_phone || '',
        branchName: branchName,
        workDate: wDate,
        checkInTime: rawCheckIn,
        checkOutTime: rawCheckOut,
        gpsDistance: Number(l.check_in_distance || l.gps_distance || l.distance || 0),
        photoUrl: l.check_in_photo_url || l.photo_url || '',
        workedMinutes: Number(l.actual_worked_minutes || l.worked_minutes || 0),
        lateMinutes: Number(l.late_minutes || 0),
        overtimeMinutes: Number(l.overtime_minutes || 0),
        status: l.status || 'ON_TIME',
        basicSalary: Number(u.salary || 5000),
        workingHoursPerDay: Number(u.hours || 8),
      };

      const key = `${item.userId}_${item.workDate}_${item.id}`;
      uniqueMap.set(key, item);
    });

    let result = Array.from(uniqueMap.values());

    if (userId && userId !== 'ALL') {
      result = result.filter((r) => {
        const matchId = String(r.userId) === String(userId);
        const matchCode = code && String(r.employeeCode) === String(code);
        const matchPhone = phone && String(r.userPhone) === String(phone);
        return matchId || matchCode || matchPhone;
      });
    }

    if (fromDate) {
      result = result.filter((r) => String(r.workDate) >= fromDate);
    }
    if (toDate) {
      result = result.filter((r) => String(r.workDate) <= toDate);
    }

    result.sort(
      (a, b) => new Date(b.checkInTime || b.workDate).getTime() - new Date(a.checkInTime || a.workDate).getTime()
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

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

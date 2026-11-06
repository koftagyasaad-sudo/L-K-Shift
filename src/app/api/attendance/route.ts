import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع سجلات الحضور والانصراف مع الفلاتر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    let query = sql`
      SELECT 
        a.id,
        CAST(a.user_id AS TEXT) as "userId",
        COALESCE(a.user_name, u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(a.user_phone, u.phone, '') as "userPhone",
        COALESCE(u.annual_leave_days, 21) as "totalLeaves",
        COALESCE(u.used_leave_days, 0) as "usedLeaves",
        COALESCE(u.monthly_permissions_hours, 0) as "permissionHours",
        COALESCE(u.monthly_salary, 0) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(a.branch_name, b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        COALESCE(a.type, 'CHECK_IN') as type,
        COALESCE(a.timestamp, a.created_at, NOW()) as timestamp,
        COALESCE(a.distance_meters, 0) as "distanceMeters",
        COALESCE(a.is_verified_geofence, true) as "isVerifiedGeofence",
        COALESCE(a.photo_url, '') as "photoUrl"
      FROM attendance_logs a
      LEFT JOIN users u ON CAST(a.user_id AS TEXT) = CAST(u.id AS TEXT)
      LEFT JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;

    if (userId && userId.trim() !== '' && userId !== 'ALL') {
      query = sql`${query} AND CAST(a.user_id AS TEXT) = ${userId.trim()}`;
    }
    if (fromDate && fromDate.trim() !== '') {
      query = sql`${query} AND COALESCE(a.timestamp, a.created_at) >= ${fromDate}::timestamptz`;
    }
    if (toDate && toDate.trim() !== '') {
      query = sql`${query} AND COALESCE(a.timestamp, a.created_at) <= (${toDate}::timestamptz + INTERVAL '1 day')`;
    }

    query = sql`${query} ORDER BY COALESCE(a.timestamp, a.created_at) DESC LIMIT 400;`;

    const raw = await db.execute(query);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching attendance logs:', error);
    return NextResponse.json({ message: 'فشل استرجاع سجلات الحضور', error: error?.message }, { status: 500 });
  }
}

// 2. تسجيل حركة الحضور والانصراف مع الصورة الحية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = (body.userId || '1').toString().trim();
    const userName = (body.userName || 'موظف').toString().trim();
    const userPhone = (body.userPhone || '').toString().trim();
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const branchName = (body.branchName || 'الفرع الرئيسي').toString().trim();
    const type = body.type === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN';
    const latitude = body.latitude ? parseFloat(String(body.latitude)) : null;
    const longitude = body.longitude ? parseFloat(String(body.longitude)) : null;
    const distanceMeters = Math.round(parseFloat(String(body.distanceMeters || '0')) || 0);
    const isVerifiedGeofence = body.isVerifiedGeofence !== undefined ? Boolean(body.isVerifiedGeofence) : true;
    const photoUrl = body.photoUrl || null;

    const raw = await db.execute(sql`
      INSERT INTO attendance_logs (
        user_id,
        user_name,
        user_phone,
        branch_id,
        branch_name,
        type,
        latitude,
        longitude,
        distance_meters,
        is_verified_geofence,
        photo_url,
        work_date,
        timestamp,
        created_at
      ) VALUES (
        ${userId},
        ${userName},
        ${userPhone},
        ${branchId},
        ${branchName},
        ${type},
        ${latitude},
        ${longitude},
        ${distanceMeters},
        ${isVerifiedGeofence},
        ${photoUrl},
        CURRENT_DATE,
        NOW(),
        NOW()
      )
      RETURNING id, type, timestamp;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(
      { success: true, message: 'تم تسجيل البصمة بنجاح', log: rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Attendance Save Error:', error);
    return NextResponse.json(
      { message: error?.message || 'فشل حفظ البصمة في السيرفر', error: error?.message },
      { status: 500 }
    );
  }
}

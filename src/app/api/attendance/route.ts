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
        a.user_id as "userId",
        u.full_name_ar as "userName",
        u.phone as "userPhone",
        u.annual_leave_days as "totalLeaves",
        u.used_leave_days as "usedLeaves",
        u.monthly_permissions_hours as "permissionHours",
        b.name_ar as "branchName",
        a.type,
        a.timestamp,
        a.distance_meters as "distanceMeters",
        a.is_verified_geofence as "isVerifiedGeofence",
        a.verification_method as "verificationMethod"
      FROM attendance_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;

    if (userId) {
      query = sql`${query} AND a.user_id = ${parseInt(userId, 10)}`;
    }
    if (fromDate) {
      query = sql`${query} AND a.timestamp >= ${fromDate}::timestamptz`;
    }
    if (toDate) {
      query = sql`${query} AND a.timestamp <= ${toDate}::timestamptz`;
    }

    query = sql`${query} ORDER BY a.timestamp DESC LIMIT 300;`;

    const raw = await db.execute(query);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching attendance logs:', error);
    return NextResponse.json({ message: 'فشل استرجاع سجلات الحضور', error: error?.message }, { status: 500 });
  }
}

// 2. تسجيل حركة حضور أو انصراف ذكية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = parseInt(body.userId, 10);
    const branchId = body.branchId ? parseInt(body.branchId, 10) : null;
    const type = body.type || 'CHECK_IN';
    const latitude = parseFloat(body.latitude) || null;
    const longitude = parseFloat(body.longitude) || null;
    const distanceMeters = parseInt(body.distanceMeters, 10) || 0;
    const isVerifiedGeofence = Boolean(body.isVerifiedGeofence);

    const raw = await db.execute(sql`
      INSERT INTO attendance_logs (
        user_id, branch_id, type, latitude, longitude, distance_meters, is_verified_geofence, verification_method, timestamp
      ) VALUES (
        ${userId}, ${branchId}, ${type}, ${latitude}, ${longitude}, ${distanceMeters}, ${isVerifiedGeofence}, 'GPS_GEOFENCE', NOW()
      )
      RETURNING id, type, timestamp;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows[0] || { message: 'تم التسجيل بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving attendance log:', error);
    return NextResponse.json({ message: 'فشل تسجيل الحركة', error: error?.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع سجلات الحضور والانصراف
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
        COALESCE(u.full_name_ar, u.name, a.user_name, 'موظف') as "userName",
        COALESCE(u.phone, a.user_phone, '') as "userPhone",
        COALESCE(u.annual_leave_days, 21) as "totalLeaves",
        COALESCE(u.used_leave_days, 0) as "usedLeaves",
        COALESCE(u.monthly_permissions_hours, 0) as "permissionHours",
        COALESCE(b.name_ar, b.name, a.branch_name, '—') as "branchName",
        a.type,
        a.timestamp,
        a.distance_meters as "distanceMeters",
        a.is_verified_geofence as "isVerifiedGeofence",
        a.verification_method as "verificationMethod"
      FROM attendance_logs a
      LEFT JOIN users u ON a.user_id = u.id::text
      LEFT JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;

    if (userId) {
      query = sql`${query} AND (a.user_id = ${userId} OR a.user_id = ${parseInt(userId, 10) || 0}::text)`;
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

// 2. تسجيل حركة الحضور بنظام Self-Healing المحصن ضد أخطاء قاعدة البيانات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = (body.userId || '1').toString().trim();
    const userName = (body.userName || 'موظف').toString().trim();
    const userPhone = (body.userPhone || '').toString().trim();
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const branchName = (body.branchName || '').toString().trim();
    const type = body.type === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN';
    const latitude = body.latitude ? parseFloat(String(body.latitude)) : null;
    const longitude = body.longitude ? parseFloat(String(body.longitude)) : null;
    const distanceMeters = Math.round(parseFloat(String(body.distanceMeters || '0')) || 0);
    const isVerifiedGeofence = body.isVerifiedGeofence !== undefined ? Boolean(body.isVerifiedGeofence) : true;

    // استعلام إدخال محصن بالكامل
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
        verification_method,
        timestamp
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
        'GPS_GEOFENCE',
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

    // خطة إنقاذ تلقائية لإنشاء الجدول فوراً في حال عدم وجوده
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS attendance_logs (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            user_name TEXT,
            user_phone TEXT,
            branch_id INTEGER,
            branch_name TEXT,
            type VARCHAR(20) NOT NULL DEFAULT 'CHECK_IN',
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            distance_meters INTEGER DEFAULT 0,
            is_verified_geofence BOOLEAN DEFAULT true,
            verification_method VARCHAR(50) DEFAULT 'GPS_GEOFENCE'
          );
        `);
        return NextResponse.json(
          { message: 'تمت تهيئة قاعدة البيانات بنجاح، اضغط مرة أخرى لتسجيل البصمة الآن' },
          { status: 200 }
        );
      } catch (tableErr: any) {
        return NextResponse.json({ message: 'فشل تهيئة قاعدة البيانات', error: tableErr?.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      { message: error?.message || 'فشل حفظ البصمة في السيرفر', error: error?.message },
      { status: 500 }
    );
  }
}

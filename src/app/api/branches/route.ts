import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع الفروع
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('id');

    if (branchId) {
      const parsedId = parseInt(branchId, 10);
      const singleRaw = await db.execute(sql`
        SELECT 
          id, 
          name_ar as "nameAr", 
          name_en as "nameEn", 
          name_ar as "name",
          phone,
          manager_id as "managerId",
          manager_name as "managerName",
          google_maps_url as "googleMapsUrl",
          address, 
          latitude::text, 
          longitude::text, 
          geofence_radius as "radiusMeters",
          geofence_radius as "geofenceRadius",
          morning_shift_start::text as "morningStart",
          morning_shift_end::text as "morningEnd",
          evening_shift_start::text as "eveningStart",
          evening_shift_end::text as "eveningEnd",
          between_shift_start::text as "betweenStart",
          between_shift_end::text as "betweenEnd",
          COALESCE(grace_period_minutes, 15) as "gracePeriod",
          is_active as "isActive",
          created_at as "createdAt"
        FROM branches 
        WHERE id = ${parsedId}
        LIMIT 1;
      `);

      const rows = Array.isArray(singleRaw) ? singleRaw : (singleRaw as any)?.rows || [];
      if (!rows.length) {
        return NextResponse.json({ message: 'الفرع غير موجود' }, { status: 404 });
      }
      return NextResponse.json(rows[0], { status: 200 });
    }

    const allBranchesRaw = await db.execute(sql`
      SELECT 
        id, 
        name_ar as "nameAr", 
        name_en as "nameEn", 
        name_ar as "name",
        phone,
        manager_id as "managerId",
        manager_name as "managerName",
        google_maps_url as "googleMapsUrl",
        address, 
        latitude::text, 
        longitude::text, 
        geofence_radius as "radiusMeters",
        morning_shift_start::text as "morningStart",
        morning_shift_end::text as "morningEnd",
        evening_shift_start::text as "eveningStart",
        evening_shift_end::text as "eveningEnd",
        between_shift_start::text as "betweenStart",
        between_shift_end::text as "betweenEnd",
        COALESCE(grace_period_minutes, 15) as "gracePeriod",
        is_active as "isActive",
        created_at as "createdAt"
      FROM branches 
      ORDER BY id ASC;
    `);

    const allBranches = Array.isArray(allBranchesRaw) ? allBranchesRaw : (allBranchesRaw as any)?.rows || [];
    return NextResponse.json(allBranches, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ message: 'فشل استرجاع بيانات الفروع', error: error?.message }, { status: 500 });
  }
}

// 2. إضافة فرع جديد بكامل بياناته والورديات الثلاث
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nameAr = body.nameAr || body.name || 'فرع جديد';
    const nameEn = body.nameEn || nameAr;
    const phone = body.phone || '';
    const managerId = body.managerId ? parseInt(String(body.managerId), 10) : null;
    const managerName = body.managerName || '';
    const googleMapsUrl = body.googleMapsUrl || '';
    const address = body.address || '';
    const latitude = parseFloat(body.latitude) || 31.1218;
    const longitude = parseFloat(body.longitude) || 30.6480;
    const radiusMeters = parseInt(body.radiusMeters || '100', 10);
    const morningStart = body.morningStart || '09:00:00';
    const morningEnd = body.morningEnd || '17:00:00';
    const eveningStart = body.eveningStart || '17:00:00';
    const eveningEnd = body.eveningEnd || '01:00:00';
    const betweenStart = body.betweenStart || '13:00:00';
    const betweenEnd = body.betweenEnd || '21:00:00';
    const gracePeriod = parseInt(body.gracePeriod || '15', 10);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const qrSecret = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const insertResult = await db.execute(sql`
      INSERT INTO branches (
        name_ar, name_en, phone, manager_id, manager_name, google_maps_url, type, address, 
        latitude, longitude, geofence_radius, qr_secret_key, morning_shift_start, morning_shift_end,
        evening_shift_start, evening_shift_end, between_shift_start, between_shift_end, 
        grace_period_minutes, is_active, created_at, updated_at
      ) VALUES (
        ${nameAr}, ${nameEn}, ${phone}, ${managerId}, ${managerName}, ${googleMapsUrl}, 'BRANCH', ${address}, 
        ${latitude}, ${longitude}, ${radiusMeters}, ${qrSecret}, ${morningStart}::time, ${morningEnd}::time,
        ${eveningStart}::time, ${eveningEnd}::time, ${betweenStart}::time, ${betweenEnd}::time,
        ${gracePeriod}, ${isActive}, NOW(), NOW()
      )
      RETURNING id, name_ar as "nameAr";
    `);

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult as any)?.rows || [];
    return NextResponse.json(rows[0] || { message: 'تم إنشاء الفرع بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ message: 'فشل حفظ الفرع', error: error?.message }, { status: 500 });
  }
}

// 3. تحديث الفرع بكامل حقوله
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rawId = body.id || new URL(request.url).searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الفرع مفقود' }, { status: 400 });
    }

    const branchId = parseInt(rawId, 10);
    const nameAr = body.nameAr || body.name;
    const nameEn = body.nameEn || nameAr;
    const phone = body.phone || '';
    const managerId = body.managerId ? parseInt(String(body.managerId), 10) : null;
    const managerName = body.managerName || '';
    const googleMapsUrl = body.googleMapsUrl || '';
    const address = body.address || '';
    const latitude = parseFloat(body.latitude) || 31.1218;
    const longitude = parseFloat(body.longitude) || 30.6480;
    const radiusMeters = parseInt(body.radiusMeters || '100', 10);
    const morningStart = body.morningStart || '09:00:00';
    const morningEnd = body.morningEnd || '17:00:00';
    const eveningStart = body.eveningStart || '17:00:00';
    const eveningEnd = body.eveningEnd || '01:00:00';
    const betweenStart = body.betweenStart || '13:00:00';
    const betweenEnd = body.betweenEnd || '21:00:00';
    const gracePeriod = parseInt(body.gracePeriod || '15', 10);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    await db.execute(sql`
      UPDATE branches 
      SET 
        name_ar = ${nameAr},
        name_en = ${nameEn},
        phone = ${phone},
        manager_id = ${managerId},
        manager_name = ${managerName},
        google_maps_url = ${googleMapsUrl},
        address = ${address},
        latitude = ${latitude},
        longitude = ${longitude},
        geofence_radius = ${radiusMeters},
        morning_shift_start = ${morningStart}::time,
        morning_shift_end = ${morningEnd}::time,
        evening_shift_start = ${eveningStart}::time,
        evening_shift_end = ${eveningEnd}::time,
        between_shift_start = ${betweenStart}::time,
        between_shift_end = ${betweenEnd}::time,
        grace_period_minutes = ${gracePeriod},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${branchId};
    `);

    return NextResponse.json({ message: 'تم تحديث بيانات الفرع والورديات بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ message: 'فشل تحديث بيانات الفرع', error: error?.message }, { status: 500 });
  }
}

// 4. حذف الفرع
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الفرع مفقود' }, { status: 400 });
    }

    const branchId = parseInt(rawId, 10);
    await db.execute(sql`DELETE FROM branches WHERE id = ${branchId};`);
    return NextResponse.json({ message: 'تم حذف الفرع بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ message: 'فشل حذف الفرع', error: error?.message }, { status: 500 });
  }
}

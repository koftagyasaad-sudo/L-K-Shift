import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع الفروع (الكل أو فرع محدد عبر ?id=...)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('id');

    if (branchId) {
      const parsedId = parseInt(branchId, 10);
      const raw = await db.execute(sql`
        SELECT 
          id, 
          name_ar as "nameAr", 
          name_en as "nameEn", 
          name_ar as "name",
          address, 
          latitude::text, 
          longitude::text, 
          geofence_radius as "radiusMeters",
          geofence_radius as "geofenceRadius",
          is_active as "isActive",
          created_at as "createdAt"
        FROM branches 
        WHERE id = ${parsedId}
        LIMIT 1;
      `);

      const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
      if (!rows.length) {
        return NextResponse.json({ message: 'الفرع غير موجود' }, { status: 404 });
      }

      return NextResponse.json(rows[0], { status: 200 });
    }

    // جلب جميع الفروع المسجلة
    const allBranchesRaw = await db.execute(sql`
      SELECT 
        id, 
        name_ar as "nameAr", 
        name_en as "nameEn", 
        name_ar as "name",
        address, 
        latitude::text, 
        longitude::text, 
        geofence_radius as "radiusMeters",
        geofence_radius as "geofenceRadius",
        is_active as "isActive",
        created_at as "createdAt"
      FROM branches 
      ORDER BY id ASC;
    `);

    const allBranches = Array.isArray(allBranchesRaw) ? allBranchesRaw : (allBranchesRaw as any)?.rows || [];
    return NextResponse.json(allBranches, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الفروع', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة فرع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nameAr = body.nameAr || body.name || 'فرع جديد';
    const nameEn = body.nameEn || nameAr;
    const address = body.address || '';
    const latitude = parseFloat(body.latitude) || 30.0444;
    const longitude = parseFloat(body.longitude) || 31.2357;
    const radiusMeters = parseInt(body.radiusMeters || body.geofenceRadius || '100', 10);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const qrSecret = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const insertResult = await db.execute(sql`
      INSERT INTO branches (
        name_ar, name_en, type, address, latitude, longitude, geofence_radius, qr_secret_key, is_active, created_at, updated_at
      ) VALUES (
        ${nameAr}, ${nameEn}, 'BRANCH', ${address}, ${latitude}, ${longitude}, ${radiusMeters}, ${qrSecret}, ${isActive}, NOW(), NOW()
      )
      RETURNING id, name_ar as "nameAr", name_en as "nameEn", is_active as "isActive";
    `);

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult as any)?.rows || [];
    return NextResponse.json(rows[0] || { message: 'تم إنشاء الفرع بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { message: 'فشل حفظ الفرع في قاعدة البيانات', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. تحديث بيانات الفرع (حل مشكلة فشل التحديث جذرياً)
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
    const address = body.address || '';
    const latitude = parseFloat(body.latitude) || 30.0444;
    const longitude = parseFloat(body.longitude) || 31.2357;
    const radiusMeters = parseInt(body.radiusMeters || body.geofenceRadius || '100', 10);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    // استعلام تحديث متطابق تماماً مع هيكل جدول branches في PostgreSQL
    await db.execute(sql`
      UPDATE branches 
      SET 
        name_ar = ${nameAr},
        name_en = ${nameEn},
        address = ${address},
        latitude = ${latitude},
        longitude = ${longitude},
        geofence_radius = ${radiusMeters},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${branchId};
    `);

    return NextResponse.json({ message: 'تم تحديث بيانات الفرع بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الفرع', error: error?.message },
      { status: 500 }
    );
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
    return NextResponse.json(
      { message: 'فشل حذف الفرع', error: error?.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const raw = await db.execute(sql`
      SELECT 
        b.id,
        COALESCE(b.name, 'Branch') as name,
        COALESCE(b.name_ar, b.name, 'فرع') as name_ar,
        COALESCE(b.name_ar, b.name, 'فرع') as "nameAr",
        COALESCE(b.latitude, 31.1308) as latitude,
        COALESCE(b.longitude, 30.6475) as longitude,
        COALESCE(b.geofence_radius, 150) as geofence_radius,
        COALESCE(b.geofence_radius, 150) as "geofenceRadius",
        b.manager_id as "managerId",
        COALESCE(u.full_name_ar, u.name, '') as "managerName",
        COALESCE(b.phone, '') as phone
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      ORDER BY b.id ASC;
    `);

    const branches = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(branches, { status: 200 });
  } catch (error: any) {
    console.error('Branches GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, nameAr, latitude, longitude, geofenceRadius, managerId, phone } = body;

    if (!nameAr) {
      return NextResponse.json({ message: 'اسم الفرع بالعربية مطلوب' }, { status: 400 });
    }

    if (id) {
      await db.execute(sql`
        UPDATE branches
        SET 
          name = COALESCE(${name || null}, name),
          name_ar = ${nameAr},
          name_en = COALESCE(${name || null}, name_en),
          latitude = ${latitude ? parseFloat(latitude) : 31.1308},
          longitude = ${longitude ? parseFloat(longitude) : 30.6475},
          geofence_radius = ${geofenceRadius ? parseInt(geofenceRadius, 10) : 150},
          manager_id = ${managerId ? parseInt(managerId, 10) : null},
          phone = ${phone || null}
        WHERE id = ${parseInt(id, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الفرع بنجاح' });
    } else {
      await db.execute(sql`
        INSERT INTO branches (name, name_en, name_ar, latitude, longitude, geofence_radius, manager_id, phone)
        VALUES (
          ${name || 'Branch'},
          ${name || 'Branch'},
          ${nameAr},
          ${latitude ? parseFloat(latitude) : 31.1308},
          ${longitude ? parseFloat(longitude) : 30.6475},
          ${geofenceRadius ? parseInt(geofenceRadius, 10) : 150},
          ${managerId ? parseInt(managerId, 10) : null},
          ${phone || null}
        );
      `);
      return NextResponse.json({ success: true, message: 'تمت إضافة الفرع الجديد بنجاح' });
    }
  } catch (error: any) {
    console.error('Branches POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حفظ الفرع' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const branchId = parseInt(id, 10);

    // 1. فك ارتباط الموظفين بالفرع قبل حذفه لتفادي قيود Foreign Key
    try {
      await db.execute(sql`
        UPDATE users 
        SET primary_branch_id = NULL 
        WHERE primary_branch_id = ${branchId};
      `);
      await db.execute(sql`
        UPDATE users 
        SET branch_id = NULL 
        WHERE branch_id = ${branchId};
      `);
    } catch {}

    // 2. فك ارتباط سجلات الحضور المرتبطة
    try {
      await db.execute(sql`
        UPDATE attendance_logs 
        SET branch_id = NULL 
        WHERE branch_id = ${branchId};
      `);
    } catch {}

    // 3. حذف الفرع نهائياً
    await db.execute(sql`
      DELETE FROM branches WHERE id = ${branchId};
    `);

    return NextResponse.json({ success: true, message: 'تم حذف الفرع بنجاح' });
  } catch (error: any) {
    console.error('Branches DELETE error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حذف الفرع' }, { status: 500 });
  }
}

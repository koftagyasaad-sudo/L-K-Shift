import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // التأكد التلقائي من وجود أعمدة الورديات الثلاث وفترة السماح والعنوان
    try {
      await db.execute(sql`
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_en VARCHAR(150);
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS qr_secret_key TEXT DEFAULT md5(random()::text);
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_start TEXT DEFAULT '09:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_end TEXT DEFAULT '17:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_start TEXT DEFAULT '13:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_end TEXT DEFAULT '21:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_start TEXT DEFAULT '17:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_end TEXT DEFAULT '01:00';
        ALTER TABLE branches ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;
      `);
    } catch {}

    const raw = await db.execute(sql`
      SELECT 
        b.id,
        COALESCE(b.name, 'Branch') as name,
        COALESCE(b.name_en, b.name, 'Branch') as "nameEn",
        COALESCE(b.name_ar, b.name, 'فرع') as name_ar,
        COALESCE(b.name_ar, b.name, 'فرع') as "nameAr",
        COALESCE(b.latitude, 31.1308) as latitude,
        COALESCE(b.longitude, 30.6475) as longitude,
        COALESCE(b.geofence_radius, 100) as geofence_radius,
        COALESCE(b.geofence_radius, 100) as "geofenceRadius",
        b.manager_id as "managerId",
        COALESCE(u.full_name_ar, u.name, '') as "managerName",
        COALESCE(b.phone, '') as phone,
        COALESCE(b.address, '') as address,
        COALESCE(b.shift1_start::text, '09:00') as "shift1Start",
        COALESCE(b.shift1_end::text, '17:00') as "shift1End",
        COALESCE(b.shift2_start::text, '13:00') as "shift2Start",
        COALESCE(b.shift2_end::text, '21:00') as "shift2End",
        COALESCE(b.shift3_start::text, '17:00') as "shift3Start",
        COALESCE(b.shift3_end::text, '01:00') as "shift3End",
        COALESCE(b.grace_period_minutes, 15) as "gracePeriodMinutes"
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
    const {
      id,
      name,
      nameEn,
      nameAr,
      latitude,
      longitude,
      geofenceRadius,
      managerId,
      phone,
      address,
      shift1Start,
      shift1End,
      shift2Start,
      shift2End,
      shift3Start,
      shift3End,
      gracePeriodMinutes,
    } = body;

    if (!nameAr) {
      return NextResponse.json({ message: 'اسم الفرع بالعربية مطلوب' }, { status: 400 });
    }

    const enName = nameEn || name || 'Branch';
    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : 31.1308;
    const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : 30.6475;
    const radius = geofenceRadius ? parseInt(geofenceRadius, 10) : 100;
    const mgrId = managerId ? parseInt(managerId, 10) : null;
    const s1Start = shift1Start || '09:00';
    const s1End = shift1End || '17:00';
    const s2Start = shift2Start || '13:00';
    const s2End = shift2End || '21:00';
    const s3Start = shift3Start || '17:00';
    const s3End = shift3End || '01:00';
    const grace = gracePeriodMinutes ? parseInt(gracePeriodMinutes, 10) : 15;

    if (id) {
      await db.execute(sql`
        UPDATE branches
        SET 
          name = ${enName},
          name_en = ${enName},
          name_ar = ${nameAr},
          latitude = ${lat},
          longitude = ${lng},
          geofence_radius = ${radius},
          manager_id = ${mgrId},
          phone = ${phone || null},
          address = ${address || null},
          shift1_start = ${s1Start},
          shift1_end = ${s1End},
          shift2_start = ${s2Start},
          shift2_end = ${s2End},
          shift3_start = ${s3Start},
          shift3_end = ${s3End},
          grace_period_minutes = ${grace}
        WHERE id = ${parseInt(id, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الفرع والورديات بنجاح' });
    } else {
      await db.execute(sql`
        INSERT INTO branches (
          name, name_en, name_ar, latitude, longitude, geofence_radius,
          manager_id, phone, address,
          shift1_start, shift1_end, shift2_start, shift2_end, shift3_start, shift3_end,
          grace_period_minutes, qr_secret_key
        ) VALUES (
          ${enName}, ${enName}, ${nameAr}, ${lat}, ${lng}, ${radius},
          ${mgrId}, ${phone || null}, ${address || null},
          ${s1Start}, ${s1End}, ${s2Start}, ${s2End}, ${s3Start}, ${s3End},
          ${grace}, md5(random()::text)
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

    try {
      await db.execute(sql`
        UPDATE attendance_logs 
        SET branch_id = NULL 
        WHERE branch_id = ${branchId};
      `);
    } catch {}

    await db.execute(sql`
      DELETE FROM branches WHERE id = ${branchId};
    `);

    return NextResponse.json({ success: true, message: 'تم حذف الفرع بنجاح' });
  } catch (error: any) {
    console.error('Branches DELETE error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حذف الفرع' }, { status: 500 });
  }
}

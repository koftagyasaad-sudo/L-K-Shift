import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const authorization = await authorizeApi([
      'branches.view',
      'branches.manage',
      'employees.view',
      'employees.manage',
      'attendance.view',
    ]);
    if ('response' in authorization) return authorization.response;

    try {
      // Migrations already executed in Neon
    } catch {}

    const raw = // Migrations already executed in Neon
    } catch {}

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
    const grace = gracePeriodMinutes !== undefined ? parseInt(gracePeriodMinutes, 10) : 15;

    if (id && Number(id) > 0) {
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
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الفرع بنجاح' });
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
    const authorization = await authorizeApi('branches.manage');
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const branchId = Number(id);
    if (!Number.isSafeInteger(branchId) || branchId < 1) {
      return NextResponse.json({ message: 'معرف الفرع غير صالح' }, { status: 400 });
    }
    if (!canAccessBranch(authorization.principal, branchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    try {
      await db.execute(sql`UPDATE users SET primary_branch_id = NULL WHERE primary_branch_id = ${branchId};`);
      await db.execute(sql`UPDATE users SET branch_id = NULL WHERE branch_id = ${branchId};`);
      await db.execute(sql`UPDATE attendance_logs SET branch_id = NULL WHERE branch_id = ${branchId};`);
    } catch {}

    await db.execute(sql`DELETE FROM branches WHERE id = ${branchId};`);

    return NextResponse.json({ success: true, message: 'تم حذف الفرع بنجاح' });
  } catch (error: any) {
    console.error('Branches DELETE error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حذف الفرع' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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

    const raw = await db.execute(sql`
      SELECT 
        b.id::text as id,
        COALESCE(b.name, 'Branch') as name,
        COALESCE(b.name_en, b.name, 'Branch') as "nameEn",
        COALESCE(b.name_ar, b.name, 'فرع') as name_ar,
        COALESCE(b.name_ar, b.name, 'فرع') as "nameAr",
        COALESCE(b.latitude, 31.1308) as latitude,
        COALESCE(b.longitude, 30.6475) as longitude,
        GREATEST(COALESCE(b.geofence_radius, 100), 100) as geofence_radius,
        GREATEST(COALESCE(b.geofence_radius, 100), 100) as "geofenceRadius",
        b.manager_id::text as "managerId",
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
      LEFT JOIN users u ON b.manager_id::text = u.id::text
      ORDER BY b.id ASC;
    `);

    const branches = resultRows<Record<string, unknown>>(raw);
    const visibleBranches = branches.filter((branch) =>
      authorization.principal.systemRole === 'SUPER_ADMIN'
      || canAccessBranch(authorization.principal, String(branch.id))
    );
    return NextResponse.json(visibleBranches, { status: 200 });
  } catch (error) {
    console.error('Branches GET error:', error);
    return NextResponse.json({ message: 'تعذر تحميل بيانات الفروع.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi('branches.manage');
    if ('response' in authorization) return authorization.response;

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

    if (id && !canAccessBranch(authorization.principal, String(id))) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
    if (!id && authorization.principal.branchScope !== 'ALL') {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    const enName = nameEn || name || 'Branch';
    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : 31.1308;
    const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : 30.6475;
    const radius = Math.max(100, Number.parseInt(geofenceRadius, 10) || 100);
    const mgrId = managerId ? String(managerId) : null;
    const s1Start = shift1Start || '09:00';
    const s1End = shift1End || '17:00';
    const s2Start = shift2Start || '13:00';
    const s2End = shift2End || '21:00';
    const s3Start = shift3Start || '17:00';
    const s3End = shift3End || '01:00';
    const grace = gracePeriodMinutes !== undefined ? parseInt(gracePeriodMinutes, 10) : 15;

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
        WHERE id::text = ${String(id)};
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
  } catch (error) {
    console.error('Branches POST error:', error);
    return NextResponse.json({ message: errorMessage(error, 'فشل حفظ الفرع') }, { status: 500 });
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

    const branchId = id.trim();
    if (!canAccessBranch(authorization.principal, branchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    try {
      await db.execute(sql`UPDATE users SET primary_branch_id = NULL WHERE primary_branch_id = ${branchId};`);
      await db.execute(sql`UPDATE users SET branch_id = NULL WHERE branch_id = ${branchId};`);
      await db.execute(sql`UPDATE attendance_logs SET branch_id = NULL WHERE branch_id = ${branchId};`);
    } catch {}

    await db.execute(sql`DELETE FROM branches WHERE id::text = ${branchId};`);

    return NextResponse.json({ success: true, message: 'تم حذف الفرع بنجاح' });
  } catch (error) {
    console.error('Branches DELETE error:', error);
    return NextResponse.json({ message: errorMessage(error, 'فشل حذف الفرع') }, { status: 500 });
  }
}

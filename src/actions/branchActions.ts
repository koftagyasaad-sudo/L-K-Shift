'use server';

import { db } from '@/db';
import { branches } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { canAccessBranch, requireApiPrincipal } from '@/lib/api-auth';
import type { ApiPrincipal } from '@/lib/api-auth';
import { getSqlRows } from '@/lib/db';

async function assertBranchAccess(principal: ApiPrincipal, branchId: string) {
  const [branch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch || !canAccessBranch(principal, branchId)) {
    throw new Error('ممنوع الوصول إلى هذا الفرع');
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface BranchData {
  id?: string;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  type?: string | null;
  address?: string | null;
  phone?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  employeeCount?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  geofenceRadius?: number | string | null;
  geofence_radius?: number | string | null;
  radiusMeters?: number | string | null;
  radius?: number | string | null;
  googleMapsUrl?: string | null;
  qrSecretKey?: string | null;
  qrRefreshSec?: number | null;
  wifiSsid?: string | null;
  shiftSchedule?: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  shiftName?: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date | null;
  [key: string]: unknown;
}

export async function getBranchesAction(): Promise<BranchData[]> {
  const principal = await requireApiPrincipal([
    'branches.view',
    'branches.manage',
    'employees.view',
    'employees.manage',
    'attendance.view',
  ]);
  try {
    const rows = getSqlRows<BranchData>(await db.execute(sql`
      SELECT
        b.id::text AS id,
        COALESCE(b.name, b.name_en, b.name_ar, '') AS name,
        b.name_ar AS "nameAr",
        b.name_en AS "nameEn",
        b.address AS address,
        b.phone AS phone,
        b.manager_id::text AS "managerId",
        COALESCE(u.full_name_ar, u.name, '') AS "managerName",
        u.phone AS "managerPhone",
        NULLIF(b.latitude::text, '')::double precision AS latitude,
        NULLIF(b.longitude::text, '')::double precision AS longitude,
        COALESCE(b.geofence_radius, 100) AS "geofenceRadius",
        COALESCE(b.geofence_radius, 100) AS "radiusMeters",
        COALESCE(b.is_active, true) AS "isActive",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt"
      FROM branches b
      LEFT JOIN users u ON b.manager_id::text = u.id::text
      ORDER BY b.created_at DESC, b.id ASC;
    `));
    return rows.filter((row) => canAccessBranch(principal, String(row.id)));
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
}

export async function getBranchByIdAction(id: string | number): Promise<BranchData | null> {
  const principal = await requireApiPrincipal([
    'branches.view',
    'branches.manage',
    'employees.view',
    'employees.manage',
    'attendance.view',
  ]);
  try {
    const branchId = String(id).trim();
    if (!branchId) return null;
    await assertBranchAccess(principal, branchId);

    const rows = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!rows || rows.length === 0) return null;

    const b = rows[0];
    return {
      ...b,
      name: b.nameAr || b.nameEn || '',
      phone: '',
      managerName: '',
    } as BranchData;
  } catch (error) {
    console.error('Error fetching branch by id:', error);
    return null;
  }
}

export async function createBranchAction(
  data: BranchData
): Promise<{ success: boolean; message?: string; error?: string; branch?: BranchData }> {
  const principal = await requireApiPrincipal('branches.manage');
  if (principal.branchScope !== 'ALL') throw new Error('ممنوع إنشاء فرع خارج نطاقك');
  try {
    const radiusValue = data.radius ?? data.radiusMeters ?? data.geofenceRadius ?? data.geofence_radius ?? 100;
    const geofenceRadius = Number(radiusValue);
    if (!Number.isSafeInteger(geofenceRadius) || geofenceRadius < 1) {
      return { success: false, error: 'نصف قطر النطاق يجب أن يكون عددًا صحيحًا موجبًا' };
    }
    const inserted = await db
      .insert(branches)
      .values({
        nameAr: data.nameAr || data.name || 'فرع جديد',
        nameEn: data.nameEn || data.name || data.nameAr || 'New Branch',
        address: data.address || '',
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        geofenceRadius,
        qrSecretKey: `lk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        qrRefreshSec: 60,
        shiftSchedule: data.shiftSchedule || '',
        shiftStartTime: data.shiftStartTime || '',
        shiftEndTime: data.shiftEndTime || '',
        shiftName: data.shiftName || '',
        isActive: true,
      })
      .returning();

    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true, branch: inserted[0] };
  } catch (error) {
    console.error('Error creating branch:', error);
    const message = errorMessage(error, 'فشل إضافة الفرع');
    return { 
      success: false, 
      message,
      error: message
    };
  }
}

export async function updateBranchAction(
  id: string | number | undefined,
  data: BranchData
): Promise<{ success: boolean; message?: string; error?: string; branch?: { id: string; geofenceRadius: number } }> {
  const principal = await requireApiPrincipal('branches.manage');
  const branchId = id == null ? '' : String(id).trim();
  if (!branchId) {
    return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
  }
  await assertBranchAccess(principal, branchId);
  try {
    const radiusValue = data.radius ?? data.radiusMeters ?? data.geofenceRadius ?? data.geofence_radius;
    const geofenceRadius = radiusValue === undefined ? undefined : Number(radiusValue);
    if (geofenceRadius !== undefined && (!Number.isSafeInteger(geofenceRadius) || geofenceRadius < 1)) {
      return { success: false, message: 'نصف قطر النطاق يجب أن يكون عددًا صحيحًا موجبًا', error: 'نصف قطر النطاق يجب أن يكون عددًا صحيحًا موجبًا' };
    }
    const updated = await db
      .update(branches)
      .set({
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...((data.name || data.nameEn) && { nameEn: data.nameEn || data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: Number(data.latitude) || 0 }),
        ...(data.longitude !== undefined && { longitude: Number(data.longitude) || 0 }),
        ...(geofenceRadius !== undefined && { geofenceRadius }),
        ...(data.shiftSchedule !== undefined && { shiftSchedule: data.shiftSchedule }),
        ...(data.shiftStartTime !== undefined && { shiftStartTime: data.shiftStartTime }),
        ...(data.shiftEndTime !== undefined && { shiftEndTime: data.shiftEndTime }),
        ...(data.shiftName !== undefined && { shiftName: data.shiftName }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning({ id: branches.id, geofenceRadius: branches.geofenceRadius });
    if (!updated.length) {
      return { success: false, message: 'الفرع غير موجود', error: 'الفرع غير موجود' };
    }

    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true, branch: updated[0] };
  } catch (error) {
    console.error('Error updating branch:', error);
    const message = errorMessage(error, 'فشل تحديث الفرع');
    return { 
      success: false, 
      message,
      error: message
    };
  }
}

export async function toggleBranchStatusAction(
  id: string | number | undefined,
  currentStatus?: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  const principal = await requireApiPrincipal('branches.manage');
  const branchId = id == null ? '' : String(id).trim();
  if (!branchId) {
    return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
  }
  await assertBranchAccess(principal, branchId);
  try {
    let newStatus = !currentStatus;
    if (currentStatus === undefined) {
      const rows = await db
        .select({ isActive: branches.isActive })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);
      if (rows.length > 0) {
        newStatus = !rows[0].isActive;
      }
    }

    await db
      .update(branches)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId));

    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error toggling branch status:', error);
    const message = errorMessage(error, 'فشل تغيير حالة الفرع');
    return { 
      success: false, 
      message,
      error: message
    };
  }
}

export async function deleteBranchAction(
  id: string | number | undefined
): Promise<{ success: boolean; message?: string; error?: string }> {
  const principal = await requireApiPrincipal('branches.manage');
  const branchId = id == null ? '' : String(id).trim();
  if (!branchId) {
    return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
  }
  await assertBranchAccess(principal, branchId);
  try {
    await db.delete(branches).where(eq(branches.id, branchId));
    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting branch:', error);
    const message = errorMessage(error, 'فشل حذف الفرع');
    return { 
      success: false, 
      message,
      error: message
    };
  }
}

export async function saveBranchAction(data: BranchData) {
  return data?.id ? updateBranchAction(data.id, data) : createBranchAction(data);
}

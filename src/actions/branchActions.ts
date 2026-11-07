'use server';

import { db } from '@/db';
import { branches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface BranchData {
  id?: any;
  name?: any;
  nameAr?: any;
  nameEn?: any;
  type?: any;
  address?: any;
  phone?: any;
  managerName?: any;
  managerPhone?: any;
  employeeCount?: any;
  latitude?: any;
  longitude?: any;
  geofenceRadius?: any;
  radiusMeters?: any;
  googleMapsUrl?: any;
  qrSecretKey?: any;
  qrRefreshSec?: any;
  wifiSsid?: any;
  shiftSchedule?: any;
  shiftStartTime?: any;
  shiftEndTime?: any;
  shiftName?: any;
  isActive?: any;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export async function getBranchesAction(): Promise<BranchData[]> {
  try {
    const rows = await db.select().from(branches).orderBy(desc(branches.createdAt));
    return rows.map((r: any) => ({
      ...r,
      name: r.nameAr || r.nameEn || '',
      phone: r.phone || '',
      managerName: r.managerName || r.manager_name || '',
    })) as BranchData[];
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getBranchByIdAction(id: any): Promise<BranchData | null> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return null;

    const rows = await db
      .select()
      .from(branches)
      .where(eq(branches.id, numericId))
      .limit(1);

    if (!rows || rows.length === 0) return null;

    const b = rows[0] as any;
    return {
      ...b,
      name: b.nameAr || b.nameEn || '',
      phone: b.phone || '',
      managerName: b.managerName || b.manager_name || '',
    } as BranchData;
  } catch (error) {
    console.error('Error fetching branch by id:', error);
    return null;
  }
}

export async function createBranchAction(
  data: any
): Promise<{ success: boolean; message?: string; error?: string; branch?: any }> {
  try {
    const inserted = await db
      .insert(branches)
      .values({
        nameAr: data.nameAr || data.name || 'فرع جديد',
        nameEn: data.nameEn || data.name || data.nameAr || 'New Branch',
        address: data.address || '',
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        geofenceRadius: Number(data.geofenceRadius || data.radiusMeters) || 100,
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
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return { 
      success: false, 
      message: error?.message || 'فشل إضافة الفرع', 
      error: error?.message || 'فشل إضافة الفرع' 
    };
  }
}

export async function updateBranchAction(
  id: any,
  data: any
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) {
      return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
    }

    await db
      .update(branches)
      .set({
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...((data.name || data.nameEn) && { nameEn: data.nameEn || data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: Number(data.latitude) || 0 }),
        ...(data.longitude !== undefined && { longitude: Number(data.longitude) || 0 }),
        ...(data.geofenceRadius !== undefined && { geofenceRadius: Number(data.geofenceRadius) || 100 }),
        ...(data.radiusMeters !== undefined && { geofenceRadius: Number(data.radiusMeters) || 100 }),
        ...(data.shiftSchedule !== undefined && { shiftSchedule: data.shiftSchedule }),
        ...(data.shiftStartTime !== undefined && { shiftStartTime: data.shiftStartTime }),
        ...(data.shiftEndTime !== undefined && { shiftEndTime: data.shiftEndTime }),
        ...(data.shiftName !== undefined && { shiftName: data.shiftName }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        updatedAt: new Date(),
      })
      .where(eq(branches.id, numericId));

    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return { 
      success: false, 
      message: error?.message || 'فشل تحديث الفرع', 
      error: error?.message || 'فشل تحديث الفرع' 
    };
  }
}

export async function toggleBranchStatusAction(
  id: any,
  currentStatus?: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) {
      return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
    }

    let newStatus = !currentStatus;
    if (currentStatus === undefined) {
      const rows = await db
        .select({ isActive: branches.isActive })
        .from(branches)
        .where(eq(branches.id, numericId))
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
      .where(eq(branches.id, numericId));

    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling branch status:', error);
    return { 
      success: false, 
      message: error?.message || 'فشل تغيير حالة الفرع', 
      error: error?.message || 'فشل تغيير حالة الفرع' 
    };
  }
}

export async function deleteBranchAction(
  id: any
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) {
      return { success: false, message: 'معرف الفرع غير صالح', error: 'معرف الفرع غير صالح' };
    }

    await db.delete(branches).where(eq(branches.id, numericId));
    revalidatePath('/[locale]/admin/branches', 'page');
    revalidatePath('/[locale]/branches', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return { 
      success: false, 
      message: error?.message || 'فشل حذف الفرع', 
      error: error?.message || 'فشل حذف الفرع' 
    };
  }
}

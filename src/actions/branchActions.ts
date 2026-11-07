'use server';

import { db } from '@/db';
import { branches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface BranchData {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  type?: 'BRANCH' | 'CENTRAL_KITCHEN' | string;
  address?: string | null;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  qrSecretKey?: string | null;
  qrRefreshSec?: number | null;
  wifiSsid?: string | null;
  shiftSchedule?: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  shiftName?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date | null;
}

export async function getBranchesAction(): Promise<BranchData[]> {
  try {
    const rows = await db.select().from(branches).orderBy(desc(branches.createdAt));
    return rows as unknown as BranchData[];
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getBranchByIdAction(id: string | number): Promise<BranchData | null> {
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
    return b as BranchData;
  } catch (error) {
    console.error('Error fetching branch by id:', error);
    return null;
  }
}

export async function createBranchAction(data: {
  nameAr: string;
  nameEn?: string;
  address?: string;
  latitude: number;
  longitude: number;
  geofenceRadius?: number;
  shiftSchedule?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftName?: string;
}): Promise<{ success: boolean; message?: string; branch?: any }> {
  try {
    const inserted = await db
      .insert(branches)
      .values({
        nameAr: data.nameAr,
        nameEn: data.nameEn || data.nameAr,
        address: data.address || '',
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        geofenceRadius: data.geofenceRadius ? Number(data.geofenceRadius) : 100,
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
    return { success: true, branch: inserted[0] };
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return { success: false, message: error?.message || 'فشل إضافة الفرع' };
  }
}

export async function updateBranchAction(
  id: string | number,
  data: Partial<BranchData>
): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الفرع غير صالح' };

    await db
      .update(branches)
      .set({
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...(data.nameEn && { nameEn: data.nameEn }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: Number(data.latitude) }),
        ...(data.longitude !== undefined && { longitude: Number(data.longitude) }),
        ...(data.geofenceRadius !== undefined && { geofenceRadius: Number(data.geofenceRadius) }),
        ...(data.shiftSchedule !== undefined && { shiftSchedule: data.shiftSchedule }),
        ...(data.shiftStartTime !== undefined && { shiftStartTime: data.shiftStartTime }),
        ...(data.shiftEndTime !== undefined && { shiftEndTime: data.shiftEndTime }),
        ...(data.shiftName !== undefined && { shiftName: data.shiftName }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        updatedAt: new Date(),
      })
      .where(eq(branches.id, numericId));

    revalidatePath('/[locale]/admin/branches', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return { success: false, message: error?.message || 'فشل تحديث الفرع' };
  }
}

export async function deleteBranchAction(id: string | number): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الفرع غير صالح' };

    await db.delete(branches).where(eq(branches.id, numericId));
    revalidatePath('/[locale]/admin/branches', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return { success: false, message: error?.message || 'فشل حذف الفرع' };
  }
}

'use server';

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export type BranchData = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  geofenceRadius?: number | null;
  qrSecretKey?: string | null;
  isActive: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export async function getBranchesAction(): Promise<BranchData[]> {
  try {
    const rawBranches = await db.select().from(branches).orderBy(desc(branches.createdAt));
    return rawBranches.map((b: any) => ({
      id: String(b.id),
      name: b.name || b.nameAr || b.nameEn || '',
      nameAr: b.nameAr || b.name || null,
      nameEn: b.nameEn || null,
      address: b.address || null,
      latitude: b.latitude !== null && b.latitude !== undefined ? Number(b.latitude) : null,
      longitude: b.longitude !== null && b.longitude !== undefined ? Number(b.longitude) : null,
      radiusMeters: b.radiusMeters || b.geofenceRadius || 100,
      geofenceRadius: b.geofenceRadius || b.radiusMeters || 100,
      qrSecretKey: b.qrSecretKey || null,
      isActive: Boolean(b.isActive ?? true),
      createdAt: b.createdAt ? new Date(b.createdAt) : null,
      updatedAt: b.updatedAt ? new Date(b.updatedAt) : null,
    }));
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getBranchByIdAction(id: string): Promise<BranchData | null> {
  try {
    const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    if (!result || result.length === 0) return null;
    const b: any = result[0];
    return {
      id: String(b.id),
      name: b.name || b.nameAr || b.nameEn || '',
      nameAr: b.nameAr || b.name || null,
      nameEn: b.nameEn || null,
      address: b.address || null,
      latitude: b.latitude !== null && b.latitude !== undefined ? Number(b.latitude) : null,
      longitude: b.longitude !== null && b.longitude !== undefined ? Number(b.longitude) : null,
      radiusMeters: b.radiusMeters || b.geofenceRadius || 100,
      geofenceRadius: b.geofenceRadius || b.radiusMeters || 100,
      qrSecretKey: b.qrSecretKey || null,
      isActive: Boolean(b.isActive ?? true),
      createdAt: b.createdAt ? new Date(b.createdAt) : null,
      updatedAt: b.updatedAt ? new Date(b.updatedAt) : null,
    };
  } catch (error) {
    console.error(`Error fetching branch with ID ${id}:`, error);
    return null;
  }
}

export async function saveBranchAction(data: Partial<BranchData> & { name: string }) {
  try {
    const { id, name, nameAr, nameEn, address, latitude, longitude, radiusMeters, geofenceRadius, isActive } = data;
    const resolvedName = name || nameAr || 'فرع جديد';
    const resolvedRadius = radiusMeters || geofenceRadius || 100;
    const resolvedSecretKey = data.qrSecretKey || crypto.randomBytes(16).toString('hex');

    if (id) {
      await db.update(branches).set({
        name: resolvedName,
        nameAr: resolvedName,
        nameEn: nameEn || null,
        address: address || null,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        radiusMeters: Number(resolvedRadius),
        geofenceRadius: Number(resolvedRadius),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        updatedAt: new Date(),
      }).where(eq(branches.id, id));

      revalidatePath('/admin/branches');
      return { success: true, message: 'تم تحديث الفرع بنجاح', id };
    } else {
      const newBranches = await db.insert(branches).values({
        name: resolvedName,
        nameAr: resolvedName,
        nameEn: nameEn || null,
        address: address || null,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        radiusMeters: Number(resolvedRadius),
        geofenceRadius: Number(resolvedRadius),
        qrSecretKey: resolvedSecretKey,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning({ id: branches.id });

      const newId = newBranches[0]?.id ? String(newBranches[0].id) : undefined;
      revalidatePath('/admin/branches');
      return { success: true, message: 'تم إنشاء الفرع بنجاح', id: newId };
    }
  } catch (error: any) {
    console.error('Error saving branch:', error);
    return { success: false, error: error?.message || 'فشل في حفظ بيانات الفرع' };
  }
}

export async function createBranchAction(data: Partial<BranchData> & { name: string }) {
  return saveBranchAction(data);
}

export async function updateBranchAction(id: string, data: Partial<BranchData> & { name: string }) {
  return saveBranchAction({ ...data, id });
}

export async function deleteBranchAction(id: string) {
  try {
    await db.delete(branches).where(eq(branches.id, id));
    revalidatePath('/admin/branches');
    return { success: true, message: 'تم حذف الفرع بنجاح' };
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return { success: false, error: error?.message || 'فشل في حذف الفرع' };
  }
}

export async function toggleBranchStatusAction(id: string, currentStatus?: boolean) {
  try {
    const isCurrentlyActive = currentStatus !== undefined ? currentStatus : true;
    await db.update(branches).set({ isActive: !isCurrentlyActive, updatedAt: new Date() }).where(eq(branches.id, id));
    revalidatePath('/admin/branches');
    return { success: true, message: 'تم تغيير حالة الفرع بنجاح' };
  } catch (error: any) {
    console.error('Error toggling branch status:', error);
    return { success: false, error: error?.message || 'فشل في تغيير حالة الفرع' };
  }
}

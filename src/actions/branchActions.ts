"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type BranchData = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  geofenceRadius?: number | null;
  radiusMeters?: number | null;
  isActive?: boolean | null;
  googleMapsUrl?: string | null;
  phone?: string | null;
  managerName?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

function parseCoordinate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : String(num);
}

function parseRadius(value: unknown): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 100;
}

export async function getBranchesAction(): Promise<BranchData[]> {
  try {
    const rows = await db.select().from(branches).orderBy(desc(branches.createdAt));

    return (rows || []).map((b: any) => {
      const nameAr = b.nameAr || b.name || "فرع بدون اسم";
      const nameEn = b.nameEn || "";
      const displayName = b.name || nameAr || nameEn || "فرع بدون اسم";
      const radius = parseRadius(b.radiusMeters ?? b.geofenceRadius);

      return {
        id: String(b.id),
        name: displayName,
        nameAr,
        nameEn,
        address: b.address || "",
        latitude: parseCoordinate(b.latitude),
        longitude: parseCoordinate(b.longitude),
        geofenceRadius: radius,
        radiusMeters: radius,
        isActive: b.isActive !== false && b.isActive !== 0,
        googleMapsUrl: b.googleMapsUrl || b.mapsUrl || "",
        phone: b.phone || "",
        managerName: b.managerName || "",
        createdAt: b.createdAt ? String(b.createdAt) : null,
        updatedAt: b.updatedAt ? String(b.updatedAt) : null,
      };
    });
  } catch (error) {
    console.error("getBranchesAction error:", error);
    return [];
  }
}

export async function getBranchByIdAction(id: string): Promise<BranchData | null> {
  try {
    const rows = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    if (!rows || rows.length === 0) return null;

    const b = rows[0] as any;
    const nameAr = b.nameAr || b.name || "فرع بدون اسم";
    const nameEn = b.nameEn || "";
    const displayName = b.name || nameAr || nameEn || "فرع بدون اسم";
    const radius = parseRadius(b.radiusMeters ?? b.geofenceRadius);

    return {
      id: String(b.id),
      name: displayName,
      nameAr,
      nameEn,
      address: b.address || "",
      latitude: parseCoordinate(b.latitude),
      longitude: parseCoordinate(b.longitude),
      geofenceRadius: radius,
      radiusMeters: radius,
      isActive: b.isActive !== false && b.isActive !== 0,
      googleMapsUrl: b.googleMapsUrl || b.mapsUrl || "",
      phone: b.phone || "",
      managerName: b.managerName || "",
      createdAt: b.createdAt ? String(b.createdAt) : null,
      updatedAt: b.updatedAt ? String(b.updatedAt) : null,
    };
  } catch (error) {
    console.error("getBranchByIdAction error:", error);
    return null;
  }
}

export async function createBranchAction(payload: Record<string, any>) {
  try {
    const name = payload.name || payload.nameAr || "فرع جديد";
    const nameAr = payload.nameAr || name;
    const nameEn = payload.nameEn || "";
    const address = payload.address || "";
    const lat = parseCoordinate(payload.latitude);
    const lng = parseCoordinate(payload.longitude);
    const radius = parseRadius(payload.radiusMeters ?? payload.geofenceRadius);
    const isActive = payload.isActive !== false && payload.isActive !== 0;
    const googleMapsUrl = payload.googleMapsUrl || payload.mapsUrl || "";
    const phone = payload.phone || "";
    const managerName = payload.managerName || "";

    const [inserted] = await db
      .insert(branches)
      .values({
        name,
        nameAr,
        nameEn,
        address,
        latitude: lat,
        longitude: lng,
        geofenceRadius: radius,
        radiusMeters: radius,
        isActive,
        googleMapsUrl,
        phone,
        managerName,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    return { success: true, data: inserted };
  } catch (error: any) {
    console.error("createBranchAction error:", error);
    return { success: false, error: error.message || "فشل إنشاء الفرع" };
  }
}

export async function updateBranchAction(id: string, payload: Record<string, any>) {
  try {
    const name = payload.name || payload.nameAr || "فرع";
    const nameAr = payload.nameAr || name;
    const nameEn = payload.nameEn || "";
    const address = payload.address || "";
    const lat = parseCoordinate(payload.latitude);
    const lng = parseCoordinate(payload.longitude);
    const radius = parseRadius(payload.radiusMeters ?? payload.geofenceRadius);
    const isActive = payload.isActive !== false && payload.isActive !== 0;
    const googleMapsUrl = payload.googleMapsUrl || payload.mapsUrl || "";
    const phone = payload.phone || "";
    const managerName = payload.managerName || "";

    await db
      .update(branches)
      .set({
        name,
        nameAr,
        nameEn,
        address,
        latitude: lat,
        longitude: lng,
        geofenceRadius: radius,
        radiusMeters: radius,
        isActive,
        googleMapsUrl,
        phone,
        managerName,
        updatedAt: new Date(),
      } as any)
      .where(eq(branches.id, id));

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    revalidatePath(`/[locale]/(app)/admin/branches/${id}`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateBranchAction error:", error);
    return { success: false, error: error.message || "فشل تحديث بيانات الفرع" };
  }
}

export async function saveBranchAction(payload: Record<string, any>) {
  if (payload.id && String(payload.id).trim() !== "") {
    return await updateBranchAction(String(payload.id), payload);
  } else {
    return await createBranchAction(payload);
  }
}

export async function toggleBranchStatusAction(id: string, currentStatus?: boolean) {
  try {
    const nextStatus = currentStatus !== undefined ? !currentStatus : true;
    await db
      .update(branches)
      .set({
        isActive: nextStatus,
        updatedAt: new Date(),
      } as any)
      .where(eq(branches.id, id));

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    return { success: true, isActive: nextStatus };
  } catch (error: any) {
    console.error("toggleBranchStatusAction error:", error);
    return { success: false, error: error.message || "فشل تغيير حالة الفرع" };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    await db.delete(branches).where(eq(branches.id, id));

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteBranchAction error:", error);
    return { success: false, error: error.message || "فشل حذف الفرع" };
  }
}

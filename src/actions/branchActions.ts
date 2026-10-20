"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { BranchData } from "@/types";

function parseLatLngFromUrl(url?: string): { lat: number; lng: number } {
  const defaultCoords = { lat: 30.0444, lng: 31.2357 }; // القاهرة
  if (!url) return defaultCoords;

  try {
    const match =
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (match && match[1] && match[2]) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
  } catch {
    /* ignore */
  }
  return defaultCoords;
}

export async function getBranchesAction(): Promise<{
  success: boolean;
  branches?: BranchData[];
  data?: BranchData[];
  error?: string;
}> {
  try {
    const rows = await db.select().from(branches).orderBy(desc(branches.createdAt));

    const result: BranchData[] = rows.map((b) => ({
      id: String(b.id),
      name: b.nameAr || b.nameEn,
      nameEn: b.nameEn,
      location: b.address || `${b.latitude}, ${b.longitude}`,
      address: b.address || "",
      radius_meters: b.geofenceRadius ?? 100,
      latitude: b.latitude,
      longitude: b.longitude,
    }));

    return { success: true, branches: result, data: result };
  } catch (err: any) {
    console.error("Error fetching branches:", err);
    return { success: false, error: err.message || "فشل في جلب بيانات الفروع" };
  }
}

export async function saveBranchAction(
  data: BranchData
): Promise<{ success: boolean; branch?: BranchData; error?: string }> {
  try {
    const nameAr = (data.name || "").trim();
    if (!nameAr) {
      return { success: false, error: "اسم الفرع مطلوب" };
    }

    const { lat, lng } = parseLatLngFromUrl(data.location);
    const finalLat = data.latitude || lat;
    const finalLng = data.longitude || lng;
    const radius = Number(data.radius_meters || 100);

    if (data.id) {
      const branchId = Number(data.id);
      const [updated] = await db
        .update(branches)
        .set({
          nameAr,
          nameEn: data.nameEn || nameAr,
          address: data.address || data.location || null,
          latitude: finalLat,
          longitude: finalLng,
          geofenceRadius: radius,
          updatedAt: new Date(),
        })
        .where(eq(branches.id, branchId))
        .returning();

      return {
        success: true,
        branch: {
          id: String(updated.id),
          name: updated.nameAr,
          radius_meters: updated.geofenceRadius,
        },
      };
    }

    const [created] = await db
      .insert(branches)
      .values({
        nameAr,
        nameEn: data.nameEn || nameAr,
        type: "BRANCH",
        address: data.address || data.location || null,
        latitude: finalLat,
        longitude: finalLng,
        geofenceRadius: radius,
        qrSecretKey: `secret_qr_${Date.now()}`,
        qrRefreshSec: 60,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      branch: {
        id: String(created.id),
        name: created.nameAr,
        radius_meters: created.geofenceRadius,
      },
    };
  } catch (err: any) {
    console.error("Error saving branch:", err);
    return { success: false, error: err.message || "فشل في حفظ بيانات الفرع" };
  }
}

export async function deleteBranchAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const branchId = Number(id);
    if (!branchId) return { success: false, error: "معرف فرع غير صالح" };

    await db.delete(branches).where(eq(branches.id, branchId));
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting branch:", err);
    return { success: false, error: err.message || "تعذر حذف الفرع لوجود موظفين مرتبطيين به" };
  }
}

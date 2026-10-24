"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type BranchData = {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  geofenceRadius?: number | null;
  radiusMeters?: number | null;
  qrSecretKey?: string | null;
  isActive?: boolean | null;
  [key: string]: any;
};

export async function getBranchesAction(): Promise<BranchData[]> {
  try {
    const list = await db.select().from(branches);
    return (list || []).map((b: any) => ({
      id: String(b.id),
      nameAr: b.nameAr || b.name || "فرع بدون اسم",
      nameEn: b.nameEn || "",
      address: b.address || "",
      latitude: String(b.latitude || "30.0444"),
      longitude: String(b.longitude || "31.2357"),
      geofenceRadius: Number(b.geofenceRadius || b.radiusMeters || 100),
      radiusMeters: Number(b.radiusMeters || b.geofenceRadius || 100),
      qrSecretKey: b.qrSecretKey || "",
      isActive: b.isActive ?? true,
    }));
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
}

export async function getBranchByIdAction(id: string) {
  try {
    const found = await db
      .select()
      .from(branches)
      .where(eq(branches.id, String(id)))
      .limit(1);

    if (!found[0]) return null;

    const b = found[0];
    return {
      success: true,
      data: b,
      ...b,
    };
  } catch (error) {
    console.error("Error fetching branch by id:", error);
    return null;
  }
}

export async function saveBranchAction(data: any) {
  try {
    const id = data.id || data.branchId;
    const nameAr = data.nameAr || data.name || "فرع جديد";
    const nameEn = data.nameEn || "";
    const address = data.address || "";
    const latitude = String(data.latitude || "30.0444");
    const longitude = String(data.longitude || "31.2357");
    const geofenceRadius = Number(
      data.radiusMeters || data.geofenceRadius || 100
    );
    const radiusMeters = geofenceRadius;
    const isActive = data.isActive ?? true;

    const qrSecretKey =
      data.qrSecretKey ||
      `qr_secret_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payload: any = {
      nameAr,
      nameEn,
      address,
      latitude,
      longitude,
      geofenceRadius,
      radiusMeters,
      qrSecretKey,
      isActive,
    };

    if (id) {
      delete payload.qrSecretKey;
      await db
        .update(branches)
        .set(payload)
        .where(eq(branches.id, String(id)));
    } else {
      await db.insert(branches).values(payload);
    }

    revalidatePath("/admin/branches");
    revalidatePath("/branches");
    return { success: true };
  } catch (error: any) {
    console.error("saveBranchAction error:", error);
    return {
      success: false,
      error: error?.message || "حدث خطأ أثناء حفظ الفرع",
    };
  }
}

export async function createBranchAction(data: any) {
  return await saveBranchAction(data);
}

export async function updateBranchAction(id: string, data: any) {
  return await saveBranchAction({ ...data, id });
}

export async function deleteBranchAction(id: string) {
  try {
    await db.delete(branches).where(eq(branches.id, String(id)));
    revalidatePath("/admin/branches");
    revalidatePath("/branches");
    return { success: true };
  } catch (error: any) {
    console.error("deleteBranchAction error:", error);
    return { success: false, error: error?.message || "فشل حذف الفرع" };
  }
}

export async function toggleBranchStatusAction(
  id: string,
  currentStatus?: boolean
) {
  try {
    const branchData = await db
      .select()
      .from(branches)
      .where(eq(branches.id, String(id)))
      .limit(1);

    if (!branchData.length) throw new Error("Branch not found");

    const newStatus =
      currentStatus !== undefined ? !currentStatus : !branchData[0].isActive;

    await db
      .update(branches)
      .set({ isActive: newStatus })
      .where(eq(branches.id, String(id)));

    revalidatePath("/admin/branches");
    revalidatePath("/branches");
    return { success: true };
  } catch (error: any) {
    console.error("toggleBranchStatusAction error:", error);
    return { success: false, error: error?.message || "فشل تغيير حالة الفرع" };
  }
}

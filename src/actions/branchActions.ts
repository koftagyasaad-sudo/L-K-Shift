"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBranchesAction() {
  try {
    return await db.select().from(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
}

export async function saveBranchAction(data: any) {
  try {
    // Payload Mapping: معالجة البيانات لتتطابق مع أعمدة قاعدة البيانات تماماً
    const payload = {
      nameAr: data.nameAr || "فرع جديد",
      nameEn: data.nameEn || "",
      address: data.address || "",
      latitude: String(data.latitude || "0"),
      longitude: String(data.longitude || "0"),
      // تحويل radiusMeters القادم من الفورم إلى geofenceRadius الذي تقبله قاعدة البيانات
      geofenceRadius: Number(data.radiusMeters || data.geofenceRadius || 100),
      isActive: data.isActive ?? true,
    };

    if (data.id) {
      await db.update(branches).set(payload).where(eq(branches.id, data.id));
    } else {
      await db.insert(branches).values(payload);
    }
    revalidatePath("/admin/branches");
    return { success: true };
  } catch (error: any) {
    console.error("saveBranchAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    await db.delete(branches).where(eq(branches.id, id));
    revalidatePath("/admin/branches");
    return { success: true };
  } catch (error: any) {
    console.error("deleteBranchAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleBranchStatusAction(id: string, currentStatus?: boolean) {
  try {
    const branchData = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    if (!branchData.length) throw new Error("Branch not found");
    const newStatus = currentStatus !== undefined ? !currentStatus : !(branchData[0].isActive);
    await db.update(branches).set({ isActive: newStatus }).where(eq(branches.id, id));
    revalidatePath("/admin/branches");
    return { success: true };
  } catch (error: any) {
    console.error("toggleBranchStatusAction error:", error);
    return { success: false, error: error.message };
  }
}

"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBranchesAction() {
  try {
    const list = await db
      .select()
      .from(branches)
      .orderBy(desc(branches.createdAt));

    return {
      success: true,
      data: list,
      branches: list,
    };
  } catch (error: any) {
    console.error("getBranchesAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch branches",
      data: [],
      branches: [],
    };
  }
}

export async function getBranchByIdAction(id: string) {
  try {
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (!branch) {
      return {
        success: false,
        error: "Branch not found",
        data: null,
        branch: null,
      };
    }

    return {
      success: true,
      data: branch,
      branch,
    };
  } catch (error: any) {
    console.error("getBranchByIdAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch branch",
      data: null,
      branch: null,
    };
  }
}

export async function createBranchAction(data: any) {
  try {
    const id = data.id || crypto.randomUUID();
    const payload: any = {
      id,
      nameAr: data.nameAr || data.name || "فرع جديد",
      nameEn: data.nameEn || data.name || "New Branch",
      address: data.address || null,
      latitude: String(data.latitude || "30.0444"),
      longitude: String(data.longitude || "31.2357"),
      geofenceRadius: Number(data.geofenceRadius || data.radiusMeters || 100),
      radiusMeters: Number(data.radiusMeters || data.geofenceRadius || 100),
      qrSecretKey: data.qrSecretKey || crypto.randomUUID(),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newBranch] = await db
      .insert(branches)
      .values(payload)
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: newBranch,
      branch: newBranch,
    };
  } catch (error: any) {
    console.error("createBranchAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to create branch",
    };
  }
}

export async function updateBranchAction(id: string, data: any) {
  try {
    const payload: any = {
      nameAr: data.nameAr || data.name,
      nameEn: data.nameEn || data.name,
      address: data.address || null,
      latitude: String(data.latitude || "30.0444"),
      longitude: String(data.longitude || "31.2357"),
      geofenceRadius: Number(data.geofenceRadius || data.radiusMeters || 100),
      radiusMeters: Number(data.radiusMeters || data.geofenceRadius || 100),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      updatedAt: new Date(),
    };

    const [updatedBranch] = await db
      .update(branches)
      .set(payload)
      .where(eq(branches.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: updatedBranch,
      branch: updatedBranch,
    };
  } catch (error: any) {
    console.error("updateBranchAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to update branch",
    };
  }
}

export async function saveBranchAction(data: any) {
  if (data.id) {
    return updateBranchAction(data.id, data);
  }
  return createBranchAction(data);
}

export async function deleteBranchAction(id: string) {
  try {
    const [deleted] = await db
      .delete(branches)
      .where(eq(branches.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: deleted,
      branch: deleted,
    };
  } catch (error: any) {
    console.error("deleteBranchAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete branch",
    };
  }
}

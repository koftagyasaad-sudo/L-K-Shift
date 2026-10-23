"use server";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface BranchData {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  radiusMeters?: number | null;
  geofenceRadius?: number | null;
  qrSecretKey?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  [key: string]: unknown;
}

export interface SaveBranchInput {
  id?: string;
  name?: string;
  nameAr?: string;
  name_ar?: string;
  nameEn?: string;
  name_en?: string;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  radius_meters?: number;
  geofenceRadius?: number;
  geofence_radius?: number;
  qrSecretKey?: string;
  qr_secret_key?: string;
  isActive?: boolean;
  is_active?: boolean;
}

export async function getBranchesAction() {
  try {
    const data = await db.select().from(branches);
    return { success: true, data };
  } catch (error) {
    console.error("getBranchesAction error:", error);
    return { success: false, error: "Failed to fetch branches", data: [] };
  }
}

export async function getBranchByIdAction(id: string) {
  try {
    if (!id) return { success: false, error: "Branch ID required" };
    const res = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    if (!res.length) return { success: false, error: "Branch not found" };
    return { success: true, data: res[0] };
  } catch (error) {
    console.error("getBranchByIdAction error:", error);
    return { success: false, error: "Failed to fetch branch" };
  }
}

export async function saveBranchAction(input: SaveBranchInput) {
  try {
    const nameAr = input.nameAr || input.name_ar || input.name || "";
    const nameEn = input.nameEn || input.name_en || input.name || "";
    const latitude = String(input.latitude ?? "0");
    const longitude = String(input.longitude ?? "0");
    const radiusMeters = input.radiusMeters ?? input.radius_meters ?? 100;
    const geofenceRadius = input.geofenceRadius ?? input.geofence_radius ?? radiusMeters;
    const qrSecretKey = input.qrSecretKey || input.qr_secret_key || `QR-${Date.now()}`;
    const isActive = input.isActive ?? input.is_active ?? true;

    if (input.id) {
      const [updated] = await db
        .update(branches)
        .set({
          nameAr,
          nameEn,
          address: input.address || null,
          latitude,
          longitude,
          radiusMeters,
          geofenceRadius,
          qrSecretKey,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(branches.id, input.id))
        .returning();

      revalidatePath("/admin/branches");
      return { success: true, data: updated };
    } else {
      const branchId = crypto.randomUUID();
      const [created] = await db
        .insert(branches)
        .values({
          id: branchId,
          nameAr,
          nameEn,
          address: input.address || null,
          latitude,
          longitude,
          radiusMeters,
          geofenceRadius,
          qrSecretKey,
          isActive,
        })
        .returning();

      revalidatePath("/admin/branches");
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("saveBranchAction error:", error);
    return { success: false, error: "Failed to save branch" };
  }
}

export async function createBranchAction(input: SaveBranchInput) {
  return saveBranchAction(input);
}

export async function updateBranchAction(id: string, input: SaveBranchInput) {
  return saveBranchAction({ ...input, id });
}

export async function deleteBranchAction(id: string) {
  try {
    if (!id) return { success: false, error: "Branch ID required" };
    await db.delete(branches).where(eq(branches.id, id));
    revalidatePath("/admin/branches");
    return { success: true };
  } catch (error) {
    console.error("deleteBranchAction error:", error);
    return { success: false, error: "Failed to delete branch" };
  }
}

export async function toggleBranchStatusAction(id: string, currentStatus: boolean) {
  try {
    const [updated] = await db
      .update(branches)
      .set({ isActive: !currentStatus, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    revalidatePath("/admin/branches");
    return { success: true, data: updated };
  } catch (error) {
    console.error("toggleBranchStatusAction error:", error);
    return { success: false, error: "Failed to toggle branch status" };
  }
}

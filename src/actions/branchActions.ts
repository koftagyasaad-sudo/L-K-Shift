"use server";

import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export type BranchData = {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  address?: string;
  location?: string;
  mapUrl?: string;
  googleMapsUrl?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusMeters?: number | string | null;
  geofenceRadius?: number | string | null;
  isActive?: boolean;
  qrSecretKey?: string;
};

function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function extractCoordsFromMapUrl(url?: string | null): {
  lat: number | null;
  lng: number | null;
} {
  if (!url || typeof url !== "string") return { lat: null, lng: null };

  const patterns: RegExp[] = [
    /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /\/search\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /place\/[^/]+\/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }

  return { lat: null, lng: null };
}

function resolveCoords(data: BranchData): { lat: number; lng: number } {
  let lat = parseCoordinate(data.latitude);
  let lng = parseCoordinate(data.longitude);

  if (lat === null || lng === null) {
    const fromUrl = extractCoordsFromMapUrl(
      data.mapUrl || data.googleMapsUrl || data.location || data.address
    );
    if (lat === null) lat = fromUrl.lat;
    if (lng === null) lng = fromUrl.lng;
  }

  return {
    lat: lat ?? 24.7136,
    lng: lng ?? 46.6753,
  };
}

function resolveRadius(data: BranchData): number {
  const r = parseCoordinate(data.radiusMeters ?? data.geofenceRadius);
  return r !== null && r > 0 ? Math.round(r) : 100;
}

function resolveNames(data: BranchData): { nameAr: string; nameEn: string } {
  const nameAr = (data.nameAr || data.name || data.nameEn || "").trim();
  const nameEn = (data.nameEn || data.name || data.nameAr || nameAr).trim();
  return {
    nameAr: nameAr || "فرع جديد",
    nameEn: nameEn || nameAr || "New Branch",
  };
}

export async function getBranchesAction() {
  try {
    const rows = await db
      .select()
      .from(branches)
      .orderBy(desc(branches.createdAt));
    return { success: true as const, data: rows };
  } catch (error) {
    console.error("getBranchesAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch branches",
      data: [] as (typeof branches.$inferSelect)[],
    };
  }
}

export async function getBranchByIdAction(id: string) {
  try {
    if (!id) {
      return {
        success: false as const,
        error: "Branch id is required",
        data: null,
      };
    }

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (!branch) {
      return {
        success: false as const,
        error: "Branch not found",
        data: null,
      };
    }

    return { success: true as const, data: branch };
  } catch (error) {
    console.error("getBranchByIdAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch branch",
      data: null,
    };
  }
}

export async function createBranchAction(data: BranchData) {
  try {
    const { nameAr, nameEn } = resolveNames(data);
    const { lat: finalLat, lng: finalLng } = resolveCoords(data);
    const radius = resolveRadius(data);
    const address = data.address || data.location || data.mapUrl || null;
    const qrSecretKey = data.qrSecretKey || nanoid(32);

    const [created] = await db
      .insert(branches)
      .values({
        id: data.id || nanoid(),
        nameAr,
        nameEn,
        address,
        latitude: String(finalLat),
        longitude: String(finalLng),
        radiusMeters: radius,
        geofenceRadius: radius,
        qrSecretKey,
        isActive: data.isActive ?? true,
      })
      .returning();

    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true as const, data: created };
  } catch (error) {
    console.error("createBranchAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create branch",
    };
  }
}

export async function updateBranchAction(id: string, data: BranchData) {
  try {
    if (!id) {
      return { success: false as const, error: "Branch id is required" };
    }

    const { nameAr, nameEn } = resolveNames(data);
    const { lat: finalLat, lng: finalLng } = resolveCoords(data);
    const radius = resolveRadius(data);

    const [updated] = await db
      .update(branches)
      .set({
        nameAr,
        nameEn,
        address: data.address || data.location || null,
        latitude: String(finalLat),
        longitude: String(finalLng),
        radiusMeters: radius,
        geofenceRadius: radius,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: "Branch not found" };
    }

    revalidatePath("/admin/branches");
    revalidatePath(`/admin/branches/${id}`);
    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("updateBranchAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update branch",
    };
  }
}

export async function saveBranchAction(data: BranchData) {
  if (data.id) {
    return updateBranchAction(data.id, data);
  }
  return createBranchAction(data);
}

export async function deleteBranchAction(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Branch id is required" };
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.branchId, id));

    if (count > 0) {
      return {
        success: false as const,
        error: `Cannot delete branch: ${count} employee(s) still assigned to this branch`,
      };
    }

    const [deleted] = await db
      .delete(branches)
      .where(eq(branches.id, id))
      .returning();

    if (!deleted) {
      return { success: false as const, error: "Branch not found" };
    }

    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true as const, data: deleted };
  } catch (error) {
    console.error("deleteBranchAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete branch",
    };
  }
}

export async function toggleBranchStatusAction(id: string, isActive: boolean) {
  try {
    const [updated] = await db
      .update(branches)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: "Branch not found" };
    }

    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("toggleBranchStatusAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle branch status",
    };
  }
}

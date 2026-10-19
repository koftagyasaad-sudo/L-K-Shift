"use server";

import { query } from "@/lib/db";
import type { BranchData } from "@/types";

export async function getBranchesAction(): Promise<{
  success: boolean;
  branches?: BranchData[];
  error?: string;
}> {
  try {
    const result = await query(
      "SELECT id, name, location, manager, phone, ext, address, radius_meters, latitude, longitude, created_at FROM branches ORDER BY name ASC"
    );

    const branches: BranchData[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location || "",
      manager: row.manager || "",
      phone: row.phone || "",
      ext: row.ext || "",
      address: row.address || "",
      radius_meters: row.radius_meters ? Number(row.radius_meters) : 100,
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    }));

    return { success: true, branches };
  } catch (err: any) {
    console.error("Error fetching branches:", err);
    return { success: false, error: err.message || "فشل في جلب الفروع" };
  }
}

export async function getBranchByIdAction(
  id: string
): Promise<{ success: boolean; branch?: BranchData; error?: string }> {
  try {
    const result = await query(
      "SELECT id, name, location, manager, phone, ext, address, radius_meters, latitude, longitude, created_at FROM branches WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "الفرع غير موجود" };
    }

    const row = result.rows[0];
    const branch: BranchData = {
      id: row.id,
      name: row.name,
      location: row.location || "",
      manager: row.manager || "",
      phone: row.phone || "",
      ext: row.ext || "",
      address: row.address || "",
      radius_meters: row.radius_meters ? Number(row.radius_meters) : 100,
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, branch };
  } catch (err: any) {
    console.error("Error fetching branch by id:", err);
    return { success: false, error: err.message || "فشل في جلب بيانات الفرع" };
  }
}

export async function createBranchAction(
  data: BranchData
): Promise<{ success: boolean; branch?: BranchData; error?: string }> {
  try {
    const { name, location, manager, phone, ext, address, radius_meters, latitude, longitude } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الفرع مطلوب" };
    }

    const result = await query(
      `INSERT INTO branches (name, location, manager, phone, ext, address, radius_meters, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, location, manager, phone, ext, address, radius_meters, latitude, longitude, created_at`,
      [
        name,
        location || null,
        manager || null,
        phone || null,
        ext || null,
        address || null,
        radius_meters || 100,
        latitude || null,
        longitude || null,
      ]
    );

    const row = result.rows[0];
    const branch: BranchData = {
      id: row.id,
      name: row.name,
      location: row.location || "",
      manager: row.manager || "",
      phone: row.phone || "",
      ext: row.ext || "",
      address: row.address || "",
      radius_meters: row.radius_meters ? Number(row.radius_meters) : 100,
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, branch };
  } catch (err: any) {
    console.error("Error creating branch:", err);
    return { success: false, error: err.message || "فشل في إنشاء الفرع" };
  }
}

export async function updateBranchAction(
  id: string,
  data: BranchData
): Promise<{ success: boolean; branch?: BranchData; error?: string }> {
  try {
    const { name, location, manager, phone, ext, address, radius_meters, latitude, longitude } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الفرع مطلوب" };
    }

    const result = await query(
      `UPDATE branches
       SET name = $1, location = $2, manager = $3, phone = $4, ext = $5, address = $6, radius_meters = $7, latitude = $8, longitude = $9
       WHERE id = $10
       RETURNING id, name, location, manager, phone, ext, address, radius_meters, latitude, longitude, created_at`,
      [
        name,
        location || null,
        manager || null,
        phone || null,
        ext || null,
        address || null,
        radius_meters || 100,
        latitude || null,
        longitude || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "الفرع غير موجود" };
    }

    const row = result.rows[0];
    const branch: BranchData = {
      id: row.id,
      name: row.name,
      location: row.location || "",
      manager: row.manager || "",
      phone: row.phone || "",
      ext: row.ext || "",
      address: row.address || "",
      radius_meters: row.radius_meters ? Number(row.radius_meters) : 100,
      latitude: row.latitude ? Number(row.latitude) : 0,
      longitude: row.longitude ? Number(row.longitude) : 0,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, branch };
  } catch (err: any) {
    console.error("Error updating branch:", err);
    return { success: false, error: err.message || "فشل في تحديث بيانات الفرع" };
  }
}

export async function deleteBranchAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await query("DELETE FROM branches WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return { success: false, error: "الفرع غير موجود أو تم حذفه مسبقاً" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting branch:", err);
    return { success: false, error: err.message || "فشل في حذف الفرع" };
  }
}

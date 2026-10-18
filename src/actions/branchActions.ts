"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";

export interface BranchData {
  id: string;
  name: string;
  manager: string;
  phone: string;
  ext: string;
  address: string;
  map_url: string;
  createdAt?: string;
}

const fallbackBranches: BranchData[] = [
  {
    id: "b1",
    name: "الفرع الرئيسي - الرياض",
    manager: "أحمد المحمود",
    phone: "+966500000001",
    ext: "101",
    address: "شارع العليا، الرياض، المملكة العربية السعودية",
    map_url: "https://maps.google.com/?q=24.7136,46.6753",
    createdAt: new Date().toISOString()
  },
  {
    id: "b2",
    name: "فرع جدة - الكورنيش",
    manager: "سارة الغامدي",
    phone: "+966500000002",
    ext: "102",
    address: "طريق الكورنيش، جدة، المملكة العربية السعودية",
    map_url: "https://maps.google.com/?q=21.5433,39.1728",
    createdAt: new Date().toISOString()
  }
];

function getClient() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function getBranchesAction(): Promise<{ success: boolean; data: BranchData[] }> {
  try {
    const sql = getClient();
    if (!sql) return { success: true, data: fallbackBranches };

    const rows = await sql`
      SELECT id, name, manager, phone, ext, address, map_url as "map_url", created_at as "createdAt"
      FROM branches
      ORDER BY created_at DESC
    `;

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        manager: r.manager || "",
        phone: r.phone || "",
        ext: r.ext || "",
        address: r.address || "",
        map_url: r.map_url || "",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  } catch (error) {
    console.error("Neon getBranchesAction Error:", error);
    return { success: true, data: fallbackBranches };
  }
}

export async function getBranchByIdAction(id: string): Promise<{ success: boolean; data: BranchData | null }> {
  try {
    const sql = getClient();
    if (!sql) {
      const found = fallbackBranches.find((b) => b.id === id) || null;
      return { success: true, data: found };
    }

    const rows = await sql`
      SELECT id, name, manager, phone, ext, address, map_url as "map_url", created_at as "createdAt"
      FROM branches
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) return { success: true, data: null };

    const r = rows[0];
    return {
      success: true,
      data: {
        id: r.id,
        name: r.name,
        manager: r.manager || "",
        phone: r.phone || "",
        ext: r.ext || "",
        address: r.address || "",
        map_url: r.map_url || "",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Neon getBranchByIdAction Error:", error);
    const found = fallbackBranches.find((b) => b.id === id) || null;
    return { success: true, data: found };
  }
}

export async function saveBranchAction(branch: BranchData): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`
        INSERT INTO branches (id, name, manager, phone, ext, address, map_url)
        VALUES (${branch.id}, ${branch.name}, ${branch.manager}, ${branch.phone}, ${branch.ext}, ${branch.address}, ${branch.map_url})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          manager = EXCLUDED.manager,
          phone = EXCLUDED.phone,
          ext = EXCLUDED.ext,
          address = EXCLUDED.address,
          map_url = EXCLUDED.map_url
      `;
    }

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon saveBranchAction Error:", error);
    return { success: false, error: error?.message || "فشل حفظ بيانات الفرع" };
  }
}

export async function deleteBranchAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`DELETE FROM branches WHERE id = ${id}`;
    }

    revalidatePath("/[locale]/(app)/admin/branches", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon deleteBranchAction Error:", error);
    return { success: false, error: error?.message || "فشل حذف الفرع" };
  }
}

"use server";

import { neon } from "@neondatabase/serverless";

export interface BranchData {
  id: string;
  name: string;
  location?: string;
  created_at?: string;
}

export async function getBranchesAction() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const branches = (await sql`
      SELECT id, name, location, created_at FROM branches ORDER BY created_at DESC
    `) as BranchData[];

    // إرجاع data و branches لتجنب أي تعارض في التسميات
    return { success: true, data: branches, branches };
  } catch (error: any) {
    console.error("getBranchesAction error:", error);
    return { success: false, data: [], branches: [], error: error.message };
  }
}

export async function getBranchByIdAction(id: string) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id, name, location, created_at FROM branches WHERE id = ${id} LIMIT 1
    `;
    if (!result || result.length === 0) {
      return { success: false, error: "الفرع غير موجود" };
    }
    return { success: true, branch: result[0] };
  } catch (error: any) {
    console.error("getBranchByIdAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveBranchAction(data: { id?: string; name: string; location?: string }) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    if (data.id) {
      await sql`
        UPDATE branches
        SET name = ${data.name}, location = ${data.location || null}
        WHERE id = ${data.id}
      `;
    } else {
      await sql`
        INSERT INTO branches (name, location)
        VALUES (${data.name}, ${data.location || null})
      `;
    }

    return { success: true };
  } catch (error: any) {
    console.error("saveBranchAction error:", error);
    return { success: false, error: error.message || "فشل حفظ بيانات الفرع" };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM branches WHERE id = ${id}`;
    return { success: true };
  } catch (error: any) {
    console.error("deleteBranchAction error:", error);
    return { success: false, error: error.message || "فشل حذف الفرع" };
  }
}

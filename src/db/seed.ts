import { eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { hashPassword } from "@/lib/passwords";

export async function ensureSeedData() {
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!phone || !password) return;

  try {
    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existingAdmin) return;

    let [branch] = await db.select({ id: branches.id }).from(branches).limit(1);
    if (!branch) {
      [branch] = await db
        .insert(branches)
        .values({
          nameAr: "الإدارة الرئيسية",
          nameEn: "Main Management",
          address: "القاهرة، مصر",
          latitude: 30.0444,
          longitude: 31.2357,
          geofenceRadius: 500,
        })
        .returning({ id: branches.id });
    }

    await db.insert(users).values({
      fullNameAr: "مدير النظام",
      phone,
      passwordHash: await hashPassword(password),
      systemRole: "SUPER_ADMIN",
      jobRole: "مدير النظام",
      primaryBranchId: branch.id,
      isActive: true,
    });
  } catch (error) {
    console.error("Error in ensureSeedData:", error);
    throw error;
  }
}

export async function ensureDemoLoginUser() {
  return ensureSeedData();
}

export default ensureSeedData;

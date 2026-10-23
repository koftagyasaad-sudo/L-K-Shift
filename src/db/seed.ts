import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ensureSeedData() {
  try {
    // 1. التحقق من وجود فرع رئيسي أو إنشائه
    const existingBranches = await db.select().from(branches).limit(1);
    let mainBranchId: string;

    if (existingBranches.length === 0) {
      const branchId = crypto.randomUUID();
      const branchPayload: any = {
        id: branchId,
        nameAr: "الإدارة الرئيسية",
        nameEn: "Main Management",
        address: "القاهرة، مصر",
        latitude: "30.0444",
        longitude: "31.2357",
        geofenceRadius: 500,
        radiusMeters: 500,
        qrSecretKey: crypto.randomUUID(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [insertedBranch] = await db
        .insert(branches)
        .values(branchPayload)
        .returning();

      mainBranchId = insertedBranch.id;
    } else {
      mainBranchId = existingBranches[0].id;
    }

    // 2. التحقق من وجود حساب المدير العام أو إنشائه
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.phone, "01000000000"))
      .limit(1);

    if (existingUsers.length === 0) {
      const adminPayload: any = {
        id: crypto.randomUUID(),
        name: "مدير النظام",
        phone: "01000000000",
        password: "123456",
        role: "SUPER_ADMIN",
        branchId: mainBranchId,
        isActive: true,
        canUseAttendanceTerminal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(users).values(adminPayload);
    }
  } catch (error) {
    console.error("Error in ensureSeedData:", error);
  }
}

export async function ensureDemoLoginUser() {
  return ensureSeedData();
}

export default ensureSeedData;

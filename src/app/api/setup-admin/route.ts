import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // 1. التحقق من وجود حساب مدير في النظام
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "SUPER_ADMIN"))
      .limit(1);

    if (existingAdmins.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Super admin user already exists.",
        data: {
          phone: existingAdmins[0].phone,
          role: existingAdmins[0].role,
        },
      });
    }

    // 2. التحقق من وجود فرع رئيسي أو إنشائه
    let branchList = await db.select().from(branches).limit(1);
    let mainBranchId: string;

    if (branchList.length === 0) {
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

      const [newBranch] = await db
        .insert(branches)
        .values(branchPayload)
        .returning();

      mainBranchId = newBranch.id;
    } else {
      mainBranchId = branchList[0].id;
    }

    // 3. إنشاء حساب مدير النظام التلقائي
    const adminId = crypto.randomUUID();
    const adminPayload: any = {
      id: adminId,
      name: "مدير النظام",
      phone: "01000000000",
      password: "123456", // كلمة المرور الافتراضية
      role: "SUPER_ADMIN",
      branchId: mainBranchId,
      isActive: true,
      canUseAttendanceTerminal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [adminUser] = await db
      .insert(users)
      .values(adminPayload)
      .returning();

    return NextResponse.json({
      success: true,
      message: "Admin user and main branch initialized successfully.",
      data: {
        phone: adminUser.phone,
        password: "123456",
        role: adminUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

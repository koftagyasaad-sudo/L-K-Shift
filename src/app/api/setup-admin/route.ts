import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branches, customRoles, shiftTemplates, users } from "@/db/schema";

const SETUP_KEY = "lk-setup-2024-fix";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== SETUP_KEY) {
    return NextResponse.json(
      { error: "Forbidden. أضف ?key=lk-setup-2024-fix للرابط" },
      { status: 403 },
    );
  }

  const log: string[] = [];

  try {
    // ==========================================================
    // الخطوة 1: إضافة الأعمدة الناقصة يدويًا (بدون drizzle-kit)
    // ==========================================================
    log.push("🔧 جاري إصلاح بنية قاعدة البيانات...");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "management_role" AS ENUM ('NONE', 'BRANCH_MANAGER', 'AREA_MANAGER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push("✅ تم التأكد من نوع management_role");

    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "governorate" text;`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_number" text;`);
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "management_role" "management_role" DEFAULT 'NONE' NOT NULL;
    `);
    log.push("✅ تم إضافة الأعمدة الناقصة: address, governorate, employee_number, management_role");

    // ==========================================================
    // الخطوة 2: مسح كل البيانات القديمة بالكامل
    // ==========================================================
    log.push("🗑️ جاري مسح البيانات القديمة...");

    await db.delete(auditLogs);
    await db.delete(users); // سيحذف تلقائيًا كل ما يرتبط بالمستخدمين (cascade)
    await db.delete(shiftTemplates);
    await db.delete(customRoles);
    await db.delete(branches);

    log.push("✅ تم مسح جميع البيانات القديمة (الموظفين، الفروع، السجلات)");

    // ==========================================================
    // الخطوة 3: إنشاء الفروع الأربعة المطلوبة فقط
    // ==========================================================
    const insertedBranches = await db
      .insert(branches)
      .values([
        {
          nameAr: "الإدارة",
          nameEn: "Management",
          type: "HQ",
          address: "كفر الشيخ، مصر",
          latitude: 31.1107,
          longitude: 30.9388,
          geofenceRadius: 150,
          qrSecretKey: "lk-management-secret",
          qrRefreshSec: 60,
          wifiSsid: "LK-MANAGEMENT",
        },
        {
          nameAr: "بروست الأسد",
          nameEn: "Lion Broast",
          type: "BRANCH",
          address: "كفر الشيخ، مصر",
          latitude: 31.1107,
          longitude: 30.9388,
          geofenceRadius: 100,
          qrSecretKey: "lion-broast-secret",
          qrRefreshSec: 60,
          wifiSsid: "LION-BROAST",
        },
        {
          nameAr: "الكفتجي - دسوق",
          nameEn: "Koftagi - Desouk",
          type: "BRANCH",
          address: "دسوق، كفر الشيخ، مصر",
          latitude: 31.1316,
          longitude: 30.644,
          geofenceRadius: 100,
          qrSecretKey: "koftagi-desouk-secret",
          qrRefreshSec: 60,
          wifiSsid: "KOFTAGI-DESOUK",
        },
        {
          nameAr: "الكفتجي - كفر الشيخ",
          nameEn: "Koftagi - Kafr El Sheikh",
          type: "BRANCH",
          address: "كفر الشيخ، مصر",
          latitude: 31.1107,
          longitude: 30.9388,
          geofenceRadius: 100,
          qrSecretKey: "koftagi-kafr-elsheikh-secret",
          qrRefreshSec: 60,
          wifiSsid: "KOFTAGI-KAFRELSHEIKH",
        },
      ])
      .returning();

    log.push(`✅ تم إنشاء ${insertedBranches.length} فروع: الإدارة، بروست الأسد، الكفتجي دسوق، الكفتجي كفر الشيخ`);

    const managementBranch = insertedBranches.find((b) => b.nameEn === "Management");

    // ==========================================================
    // الخطوة 4: إنشاء يوزر admin جديد تمامًا
    // ==========================================================
    const passwordHash = await hash("123", 10);

    const [adminUser] = await db
      .insert(users)
      .values({
        fullNameAr: "المدير العام",
        fullNameEn: "Admin",
        phone: "admin",
        passwordHash,
        systemRole: "SUPER_ADMIN",
        jobRole: "System Administrator",
        primaryBranchId: managementBranch?.id ?? null,
        verificationMode: "MANUAL",
        hireDate: new Date(),
        salaryType: "MONTHLY",
        monthlySalary: "0.00",
        isActive: true,
      })
      .returning();

    log.push(`✅ تم إنشاء يوزر admin جديد (id: ${adminUser.id})`);

    return NextResponse.json({
      success: true,
      log,
      final_result: {
        phone: adminUser.phone,
        systemRole: adminUser.systemRole,
        isActive: adminUser.isActive,
        branches_count: insertedBranches.length,
        branches: insertedBranches.map((b) => b.nameAr),
      },
      message: "🎉 تم إصلاح كل شيء بنجاح! سجّل دخول بـ phone: admin / password: 123",
    });
  } catch (error) {
    log.push(`❌ خطأ: ${String(error)}`);
    return NextResponse.json({ success: false, log, error: String(error) }, { status: 500 });
  }
}

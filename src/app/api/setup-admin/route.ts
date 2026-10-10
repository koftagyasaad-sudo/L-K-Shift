import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, users } from "@/db/schema";

const SETUP_KEY = "lk-setup-2024-fix";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const log: string[] = [];

  try {
    // ==========================================================
    // الخطوة 0: إصلاح بنية قاعدة البيانات (إضافة أي أعمدة ناقصة بأمان)
    // ==========================================================
    log.push("🔧 جاري التحقق من بنية قاعدة البيانات...");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "approval_status" AS ENUM ('AUTO_APPROVED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // أعمدة الراتب وساعات العمل
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "working_hours_per_day" integer DEFAULT 8 NOT NULL;`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "working_days_per_month" integer DEFAULT 26 NOT NULL;`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "annual_leave_days" integer DEFAULT 21 NOT NULL;`);

    // أعمدة صور ومراجعة الحضور/الانصراف
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_in_photo_url" text;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_in_approval_status" "approval_status";`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_in_reviewed_by" integer;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_in_reviewed_at" timestamp with time zone;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_in_review_notes" text;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_out_photo_url" text;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_out_approval_status" "approval_status";`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_out_reviewed_by" integer;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_out_reviewed_at" timestamp with time zone;`);
    await db.execute(sql`ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "check_out_review_notes" text;`);

    log.push("✅ تم التأكد من جميع الأعمدة المطلوبة (الراتب + الحضور بالصور)");

    // ==========================================================
    // الخطوة 1: تأكد من وجود الفروع (بدون حذف أي شيء)
    // ==========================================================
    const existingBranches = await db.select().from(branches);

    let branchList = existingBranches;
    if (existingBranches.length === 0) {
      branchList = await db
        .insert(branches)
        .values([
          {
            nameAr: "الإدارة",
            nameEn: "Management",
            type: "BRANCH",
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
      log.push(`✅ تم إنشاء ${branchList.length} فروع جديدة`);
    } else {
      log.push(`ℹ️ الفروع موجودة بالفعل (${branchList.length} فرع)`);
    }

    const managementBranch = branchList.find((b) => b.nameEn === "Management") ?? branchList[0];

    // ==========================================================
    // الخطوة 2: تأكد من وجود admin أو أصلحه (بدون حذف أي شيء)
    // ==========================================================
    const existingAdminList = await db.select().from(users).where(eq(users.phone, "admin"));

    if (existingAdminList.length === 0) {
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
      log.push(`✅ تم إنشاء مستخدم admin جديد (id: ${adminUser.id})`);
    } else {
      const admin = existingAdminList[0];
      const passwordOk = await compare("123", admin.passwordHash);

      if (!passwordOk || !admin.isActive) {
        const passwordHash = await hash("123", 10);
        await db
          .update(users)
          .set({ passwordHash, isActive: true, systemRole: "SUPER_ADMIN" })
          .where(eq(users.id, admin.id));
        log.push("🔧 تم إصلاح كلمة مرور/حالة admin");
      } else {
        log.push("ℹ️ admin موجود وكلمة المرور صحيحة بالفعل");
      }
    }

    return NextResponse.json({
      success: true,
      log,
      message: "تم الإصلاح بنجاح وبأمان. سجّل دخول بـ admin / 123",
    });
  } catch (error) {
    log.push(`❌ خطأ: ${String(error)}`);
    return NextResponse.json({ success: false, log, error: String(error) }, { status: 500 });
  }
}

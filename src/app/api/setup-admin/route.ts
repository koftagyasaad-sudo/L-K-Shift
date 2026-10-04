// src/app/api/setup-admin/route.ts
import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// مفتاح سري بسيط مكتوب مباشرة هنا (مؤقت للإعداد فقط - يُحذف الملف بعد الانتهاء)
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
    // 1) تأكد من وجود الفروع الأربعة، أنشئها لو مش موجودة
    const existingBranches = await db.select().from(branches);
    log.push(`عدد الفروع الحالية: ${existingBranches.length}`);

    let managementBranchId: number | null = null;

    if (existingBranches.length === 0) {
      const inserted = await db
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

      managementBranchId = inserted.find((b) => b.nameEn === "Management")?.id ?? null;
      log.push("✅ تم إنشاء الفروع الأربعة بنجاح");
    } else {
      const mgmt = existingBranches.find((b) => b.nameEn === "Management");
      managementBranchId = mgmt?.id ?? existingBranches[0].id;
      log.push("الفروع موجودة بالفعل، لم يتم إنشاء فروع جديدة");
    }

    // 2) تحقق من وجود يوزر admin
    const existingAdmin = await db.select().from(users).where(eq(users.phone, "admin")).limit(1);
    const passwordHash = await hash("123", 10);

    if (existingAdmin.length > 0) {
      const user = existingAdmin[0];
      log.push(`يوزر "admin" موجود بالفعل (id: ${user.id})`);
      log.push(`الحالة الحالية: isActive=${user.isActive}, systemRole=${user.systemRole}`);

      // تأكد إن كلمة المرور صح
      const currentPasswordValid = await compare("123", user.passwordHash);
      log.push(`هل كلمة المرور الحالية "123" صحيحة؟ ${currentPasswordValid}`);

      // فرض التصحيح الكامل بغض النظر عن الحالة السابقة
      await db
        .update(users)
        .set({
          passwordHash,
          systemRole: "SUPER_ADMIN",
          isActive: true,
          fullNameAr: "المدير العام",
          fullNameEn: "Admin",
          jobRole: "System Administrator",
          primaryBranchId: user.primaryBranchId ?? managementBranchId,
        })
        .where(eq(users.id, user.id));

      log.push("✅ تم فرض تحديث اليوزر: SUPER_ADMIN + isActive=true + password=123");
    } else {
      await db.insert(users).values({
        fullNameAr: "المدير العام",
        fullNameEn: "Admin",
        phone: "admin",
        passwordHash,
        systemRole: "SUPER_ADMIN",
        jobRole: "System Administrator",
        primaryBranchId: managementBranchId,
        verificationMode: "MANUAL",
        hireDate: new Date(),
        salaryType: "MONTHLY",
        monthlySalary: "0.00",
        isActive: true,
      });
      log.push("✅ تم إنشاء يوزر admin جديد من الصفر");
    }

    // 3) تحقق نهائي من النتيجة
    const finalCheck = await db.select().from(users).where(eq(users.phone, "admin")).limit(1);
    const finalUser = finalCheck[0];
    const finalPasswordValid = await compare("123", finalUser.passwordHash);

    return NextResponse.json({
      success: true,
      log,
      final_verification: {
        phone: finalUser.phone,
        systemRole: finalUser.systemRole,
        isActive: finalUser.isActive,
        password_123_works: finalPasswordValid,
      },
      env_check: {
        AUTH_SECRET_configured: Boolean(process.env.AUTH_SECRET),
        DATABASE_URL_configured: Boolean(process.env.DATABASE_URL),
      },
      message: finalPasswordValid
        ? "🎉 كل شيء جاهز! سجّل دخول بـ phone: admin / password: 123"
        : "⚠️ هناك مشكلة في تخزين كلمة المرور",
    });
  } catch (error) {
    log.push(`❌ خطأ: ${String(error)}`);
    return NextResponse.json({ success: false, log, error: String(error) }, { status: 500 });
  }
}

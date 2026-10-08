import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, users } from "@/db/schema";

const SETUP_KEY = "lk-setup-2024-fix";

// ⚠️ هذا الملف لم يعد يحذف أي بيانات إطلاقًا. فقط يتحقق وينشئ الناقص.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const log: string[] = [];

  try {
    // 1) تأكد من وجود الفروع، أنشئها فقط لو الجدول فاضي
    const existingBranches = await db.select().from(branches);

    let branchList = existingBranches;
    if (existingBranches.length === 0) {
      branchList = await db
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
      log.push(`✅ تم إنشاء ${branchList.length} فروع جديدة (لم تكن موجودة)`);
    } else {
      log.push(`ℹ️ الفروع موجودة بالفعل (${branchList.length} فرع)، لم يتم إنشاء جديد`);
    }

    const managementBranch = branchList.find((b) => b.nameEn === "Management") ?? branchList[0];

    // 2) تأكد من وجود admin، أنشئه فقط لو مش موجود، أو أصلح كلمة سره لو موجود بس معطوب
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
        log.push("🔧 تم إصلاح كلمة مرور/حالة المستخدم admin الموجود بالفعل");
      } else {
        log.push("ℹ️ مستخدم admin موجود بالفعل وكلمة المرور صحيحة، لم يتم تعديل شيء");
      }
    }

    return NextResponse.json({
      success: true,
      log,
      message: "تم التحقق/الإصلاح بأمان دون حذف أي بيانات. سجّل دخول بـ admin / 123",
    });
  } catch (error) {
    log.push(`❌ خطأ: ${String(error)}`);
    return NextResponse.json({ success: false, log, error: String(error) }, { status: 500 });
  }
}
